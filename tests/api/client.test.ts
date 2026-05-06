import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfluenceClient } from '../../src/api/client.js';
import { ConfluenceAPIError } from '../../src/types.js';

const originalFetch = global.fetch;

describe('ConfluenceClient', () => {
  let client: ConfluenceClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  const config = {
    baseUrl: 'https://example.atlassian.net/wiki',
    email: 'test@example.com',
    apiToken: 'test_token'
  };

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
    client = new ConfluenceClient(config);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('initializes with correct baseUrl and auth', () => {
      const testClient = new ConfluenceClient(config);
      expect((testClient as any).baseUrl).toBe('https://example.atlassian.net/wiki/api/v2');
      expect((testClient as any).authHeader).toBeDefined();
    });

    it('handles baseUrl with trailing slash', () => {
      const testClient = new ConfluenceClient({
        ...config,
        baseUrl: 'https://example.atlassian.net/wiki/'
      });
      expect((testClient as any).baseUrl).toBe('https://example.atlassian.net/wiki/api/v2');
    });
  });

  describe('rate limit tracking', () => {
    it('updates rate limit from headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === 'X-RateLimit-Remaining') return '50000';
            if (name === 'X-RateLimit-Reset') return '1704067200';
            return null;
          },
          json: async () => ({ results: [] })
        }
      });

      await client.request('GET', '/spaces');

      expect((client as any).rateLimitRemaining).toBe(50000);
      expect((client as any).rateLimitReset).toBe(1704067200000);
    });
  });

  describe('retry logic', () => {
    it('retries on 429 with exponential backoff', async () => {
      mockFetch
        .mockResolvedValueOnce({
          status: 429,
          ok: false,
          headers: {
            get: () => '1'
          },
          text: async () => 'Rate limit exceeded'
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: {
            get: (name: string) => {
              if (name === 'Content-Type') return 'application/json';
              return null;
            }
          },
          json: async () => ({ results: [] })
        });

      const result = await client.request('GET', '/spaces');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ results: [] });
    });

    it('retries on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: {
            get: (name: string) => {
              if (name === 'Content-Type') return 'application/json';
              return null;
            }
          },
          json: async () => ({ success: true })
        });

      const result = await client.request('GET', '/spaces');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    it('throws after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.request('GET', '/spaces')).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('throws ConfluenceAPIError on 404', async () => {
      mockFetch.mockResolvedValue({
        status: 404,
        ok: false,
        headers: {
          get: () => null
        },
        text: async () => 'Page not found'
      });

      await expect(client.request('GET', '/pages/99999'))
        .rejects
        .toThrow(ConfluenceAPIError);

      await expect(client.request('GET', '/pages/99999'))
        .rejects
        .toThrow('Page not found');
    });

    it('includes status code in error', async () => {
      mockFetch.mockResolvedValue({
        status: 500,
        ok: false,
        headers: {
          get: () => null
        },
        text: async () => 'Internal server error'
      });

      try {
        await client.request('GET', '/spaces');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfluenceAPIError);
        expect((error as ConfluenceAPIError).statusCode).toBe(500);
      }
    });

    it('does not retry on API errors', async () => {
      mockFetch.mockResolvedValue({
        status: 400,
        ok: false,
        headers: {
          get: () => null
        },
        text: async () => 'Bad request'
      });

      try {
        await client.request('GET', '/spaces');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfluenceAPIError);
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
