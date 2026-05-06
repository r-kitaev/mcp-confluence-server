import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerPageReviewPrompt } from '../../src/prompts/pageReview.js';
import * as pagesApi from '../../src/api/pages.js';

vi.mock('../../src/api/pages.js');

describe('registerPageReviewPrompt', () => {
  let server: McpServer;
  let client: ConfluenceClient;
  let promptHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    promptHandler = vi.fn();
    server = {
      registerPrompt: vi.fn()
    } as unknown as McpServer;
    client = {} as ConfluenceClient;
    vi.clearAllMocks();
  });

  it('возвращает правильную структуру с messages array', async () => {
    vi.mocked(pagesApi.getPage).mockResolvedValue({
      id: '123',
      title: 'Test Page',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-20T10:00:00.000Z',
      version: {
        number: 2,
        createdAt: '2024-01-21T09:00:00.000Z'
      },
      _links: {
        webui: '/spaces/DEV/pages/123',
        editui: '/pages/editpage.action?pageId=123',
        base: ''
      }
    });

    registerPageReviewPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ pageId: '123' });

    expect(result).toHaveProperty('messages');
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages).toHaveLength(1);
  });

  it('включает title страницы в промпт', async () => {
    vi.mocked(pagesApi.getPage).mockResolvedValue({
      id: '123',
      title: 'API Documentation',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-20T10:00:00.000Z',
      version: {
        number: 2,
        createdAt: '2024-01-21T09:00:00.000Z'
      },
      _links: {
        webui: '/spaces/DEV/pages/123',
        editui: '/pages/editpage.action?pageId=123',
        base: ''
      }
    });

    registerPageReviewPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ pageId: '123' });

    const promptText = result.messages[0].content.text;
    expect(promptText).toContain('Page: API Documentation');
  });

  it('включает содержимое страницы в промпт', async () => {
    vi.mocked(pagesApi.getPage).mockResolvedValue({
      id: '123',
      title: 'Test Page',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-20T10:00:00.000Z',
      version: {
        number: 2,
        createdAt: '2024-01-21T09:00:00.000Z'
      },
      body: {
        view: {
          value: '<h1>Test Content</h1><p>Some content here</p>'
        }
      },
      _links: {
        webui: '/spaces/DEV/pages/123',
        editui: '/pages/editpage.action?pageId=123',
        base: ''
      }
    });

    registerPageReviewPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ pageId: '123' });

    const promptText = result.messages[0].content.text;
    expect(promptText).toContain('<h1>Test Content</h1>');
  });

  it('включает инструкции для ревью (clarity, accuracy, missing, suggestions)', async () => {
    vi.mocked(pagesApi.getPage).mockResolvedValue({
      id: '123',
      title: 'Test Page',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-20T10:00:00.000Z',
      version: {
        number: 2,
        createdAt: '2024-01-21T09:00:00.000Z'
      },
      body: {
        view: {
          value: '<p>Content</p>'
        }
      },
      _links: {
        webui: '/spaces/DEV/pages/123',
        editui: '/pages/editpage.action?pageId=123',
        base: ''
      }
    });

    registerPageReviewPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ pageId: '123' });

    const promptText = result.messages[0].content.text;
    expect(promptText).toContain('Clarity and structure');
    expect(promptText).toContain('Technical accuracy');
    expect(promptText).toContain('Missing information');
    expect(promptText).toContain('Suggestions for improvement');
  });

  it('обрабатывает ошибки API', async () => {
    vi.mocked(pagesApi.getPage).mockRejectedValue(new Error('API Error'));

    registerPageReviewPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];

    await expect(handler({ pageId: '123' })).rejects.toThrow('API Error');
  });
});
