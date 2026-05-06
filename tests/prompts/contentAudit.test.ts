import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerContentAuditPrompt } from '../../src/prompts/contentAudit.js';
import * as spacesApi from '../../src/api/spaces.js';
import * as pagesApi from '../../src/api/pages.js';

vi.mock('../../src/api/spaces.js');
vi.mock('../../src/api/pages.js');

describe('registerContentAuditPrompt', () => {
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
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'DEV',
      name: 'Development',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/DEV',
        base: ''
      }
    });

    vi.mocked(pagesApi.listPages).mockResolvedValue({
      results: [],
      _links: {
        base: ''
      }
    });

    registerContentAuditPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ spaceId: 'DEV', limit: 100 });

    expect(result).toHaveProperty('messages');
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages).toHaveLength(1);
  });

  it('включает название пространства в промпт', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'DEV',
      name: 'Development',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/DEV',
        base: ''
      }
    });

    vi.mocked(pagesApi.listPages).mockResolvedValue({
      results: [],
      _links: {
        base: ''
      }
    });

    registerContentAuditPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ spaceId: 'DEV', limit: 100 });

    const promptText = result.messages[0].content.text;
    expect(promptText).toContain('Development');
    expect(promptText).toContain('DEV');
  });

  it('включает статистику (total pages, homepage ID)', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'DEV',
      name: 'Development',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/DEV',
        base: ''
      }
    });

    vi.mocked(pagesApi.listPages).mockResolvedValue({
      results: [
        {
          id: '1',
          title: 'Home',
          spaceId: 'DEV',
          position: 0,
          createdAt: '2024-01-01T00:00:00.000Z',
          version: { number: 1, createdAt: '2024-01-01T00:00:00.000Z' },
          _links: { webui: '', editui: '', base: '' }
        }
      ],
      _links: {
        base: ''
      }
    });

    registerContentAuditPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ spaceId: 'DEV', limit: 100 });

    const promptText = result.messages[0].content.text;
    expect(promptText).toContain('Total Pages: 1');
  });

  it('включает иерархию страниц в JSON формате', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'DEV',
      name: 'Development',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/DEV',
        base: ''
      }
    });

    vi.mocked(pagesApi.listPages).mockResolvedValue({
      results: [
        {
          id: '1',
          title: 'Home',
          spaceId: 'DEV',
          parentId: undefined,
          position: 0,
          createdAt: '2024-01-01T00:00:00.000Z',
          version: { number: 1, createdAt: '2024-01-01T00:00:00.000Z' },
          _links: { webui: '', editui: '', base: '' }
        },
        {
          id: '2',
          title: 'API',
          spaceId: 'DEV',
          parentId: '1',
          position: 0,
          createdAt: '2024-01-02T00:00:00.000Z',
          version: { number: 1, createdAt: '2024-01-02T00:00:00.000Z' },
          _links: { webui: '', editui: '', base: '' }
        }
      ],
      _links: {
        base: ''
      }
    });

    registerContentAuditPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ spaceId: 'DEV', limit: 100 });

    const promptText = result.messages[0].content.text;
    expect(promptText).toContain('Page Hierarchy:');
    expect(promptText).toContain('"id": "1"');
    expect(promptText).toContain('"title": "Home"');
    expect(promptText).toContain('"parentId": null');
  });

  it('включает задачи для аудита (orphaned, nested, reorganization, outdated)', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'DEV',
      name: 'Development',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/DEV',
        base: ''
      }
    });

    vi.mocked(pagesApi.listPages).mockResolvedValue({
      results: [],
      _links: {
        base: ''
      }
    });

    registerContentAuditPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    const result = await handler({ spaceId: 'DEV', limit: 100 });

    const promptText = result.messages[0].content.text;
    expect(promptText).toContain('Identify orphaned pages (no parent, not homepage)');
    expect(promptText).toContain('Find deeply nested pages (>5 levels)');
    expect(promptText).toContain('Suggest content reorganization');
    expect(promptText).toContain('Identify outdated pages (not updated in 6+ months)');
  });

  it('работает с default limit (100)', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'DEV',
      name: 'Development',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/DEV',
        base: ''
      }
    });

    vi.mocked(pagesApi.listPages).mockResolvedValue({
      results: [],
      _links: {
        base: ''
      }
    });

    registerContentAuditPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];
    await handler({ spaceId: 'DEV', limit: 100 });

    expect(vi.mocked(pagesApi.listPages)).toHaveBeenCalledWith(client, 'DEV', { limit: 100 });
  });

  it('обрабатывает ошибки API', async () => {
    vi.mocked(spacesApi.getSpace).mockRejectedValue(new Error('API Error'));

    registerContentAuditPrompt(server, client);
    const call = vi.mocked(server.registerPrompt).mock.calls[0];
    const handler = call[2];

    await expect(handler({ spaceId: 'DEV', limit: 100 })).rejects.toThrow('API Error');
  });
});
