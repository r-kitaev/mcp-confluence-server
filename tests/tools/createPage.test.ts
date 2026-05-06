import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerCreatePageTool } from '../../src/tools/createPage.js';
import * as pagesApi from '../../src/api/pages.js';

vi.mock('../../src/api/pages.js', () => ({
  createPage: vi.fn()
}));

describe('createPage tool', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredTool: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredTool = null;

    mockServer = {
      tool: vi.fn((name, description, schema, annotations, handler) => {
        if (name === 'createPage') {
          registeredTool = handler;
        }
      })
    } as any;
  });

  it('creates page with required fields', async () => {
    vi.mocked(pagesApi.createPage).mockResolvedValue({
      id: '12345',
      title: 'New Page',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      version: {
        number: 1,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      _links: {
        webui: '/spaces/DEV/pages/12345',
        editui: '/pages/resumedraft.action?pageId=12345',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerCreatePageTool(mockServer, mockClient);

    const result = await registeredTool({
      spaceId: 'DEV',
      title: 'New Page',
      body: '<p>Content</p>'
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.pageId).toBe('12345');
    expect(data.title).toBe('New Page');
    expect(data.webUrl).toBeDefined();
    expect(data.editUrl).toBeDefined();
  });

  it('creates page with parentId', async () => {
    vi.mocked(pagesApi.createPage).mockResolvedValue({
      id: '67890',
      title: 'Child Page',
      spaceId: 'DEV',
      parentId: '12345',
      position: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      version: {
        number: 1,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      _links: {
        webui: '/spaces/DEV/pages/67890',
        editui: '/pages/resumedraft.action?pageId=67890',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerCreatePageTool(mockServer, mockClient);
    await registeredTool({
      spaceId: 'DEV',
      title: 'Child Page',
      body: '<p>Content</p>',
      parentId: '12345'
    });

    expect(pagesApi.createPage).toHaveBeenCalledWith(mockClient, expect.objectContaining({
      parentId: '12345'
    }));
  });

  it('returns correct response structure', async () => {
    vi.mocked(pagesApi.createPage).mockResolvedValue({
      id: '11111',
      title: 'Test',
      spaceId: 'TEST',
      position: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      version: {
        number: 1,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      _links: {
        webui: '/url',
        editui: '/edit',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerCreatePageTool(mockServer, mockClient);
    const result = await registeredTool({
      spaceId: 'TEST',
      title: 'Test',
      body: '<p>Test</p>'
    });

    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('pageId');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('spaceId');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('webUrl');
    expect(data).toHaveProperty('editUrl');
  });
});
