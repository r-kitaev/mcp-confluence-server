import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfluenceClient } from '../../src/api/client.js';
import * as spacesApi from '../../src/api/spaces.js';
import type { Space, PaginatedResponse } from '../../src/types.js';

describe('spaces API', () => {
  let mockClient: ConfluenceClient;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    mockClient = {
      request: mockRequest
    } as unknown as ConfluenceClient;
  });

  describe('getSpace', () => {
    it('calls client.request with correct arguments', async () => {
      const mockSpace: Space = {
        id: '12345',
        key: 'TEST',
        name: 'Test Space',
        type: 'global',
        status: 'current',
        createdAt: '2024-01-01T00:00:00.000Z',
        _links: {
          webui: '/spaces/TEST',
          base: 'https://example.atlassian.net/wiki'
        }
      };

      mockRequest.mockResolvedValue(mockSpace);

      const result = await spacesApi.getSpace(mockClient, 'TEST');

      expect(mockRequest).toHaveBeenCalledWith('GET', '/spaces/TEST');
      expect(result).toEqual(mockSpace);
    });
  });

  describe('listSpaces', () => {
    it('passes limit and cursor to request', async () => {
      const mockResponse: PaginatedResponse<Space> = {
        results: [],
        _links: {
          base: 'https://example.atlassian.net/wiki/api/v2'
        }
      };

      mockRequest.mockResolvedValue(mockResponse);

      await spacesApi.listSpaces(mockClient, { limit: 50, cursor: 'abc123' });

      expect(mockRequest).toHaveBeenCalledWith('GET', '/spaces?limit=50&cursor=abc123');
    });

    it('works without options', async () => {
      const mockResponse: PaginatedResponse<Space> = {
        results: [],
        _links: {
          base: 'https://example.atlassian.net/wiki/api/v2'
        }
      };

      mockRequest.mockResolvedValue(mockResponse);

      await spacesApi.listSpaces(mockClient);

      expect(mockRequest).toHaveBeenCalledWith('GET', '/spaces');
    });
  });

  describe('createSpace', () => {
    it('sends POST with correct body', async () => {
      const mockSpace: Space = {
        id: '12345',
        key: 'NEW',
        name: 'New Space',
        type: 'global',
        status: 'current',
        createdAt: '2024-01-01T00:00:00.000Z',
        _links: {
          webui: '/spaces/NEW',
          base: 'https://example.atlassian.net/wiki'
        }
      };

      mockRequest.mockResolvedValue(mockSpace);

      const spaceData = {
        key: 'NEW',
        name: 'New Space',
        description: 'Test description',
        isPrivate: false
      };

      await spacesApi.createSpace(mockClient, spaceData);

      expect(mockRequest).toHaveBeenCalledWith('POST', '/spaces', spaceData);
    });
  });

  describe('getSpacePermissions', () => {
    it('calls correct endpoint', async () => {
      const mockPermissions = {
        results: [],
        _links: {
          base: 'https://example.atlassian.net/wiki/api/v2'
        }
      };

      mockRequest.mockResolvedValue(mockPermissions);

      await spacesApi.getSpacePermissions(mockClient, '12345');

      expect(mockRequest).toHaveBeenCalledWith('GET', '/spaces/12345/permissions');
    });
  });
});
