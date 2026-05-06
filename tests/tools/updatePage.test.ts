import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerUpdatePageTool } from '../../src/tools/updatePage.js';
import * as pagesApi from '../../src/api/pages.js';

vi.mock('../../src/api/pages.js', () => ({
  updatePage: vi.fn()
}));

describe('updatePage tool', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredTool: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredTool = null;

    mockServer = {
      tool: vi.fn((name, description, schema, annotations, handler) => {
        if (name === 'updatePage') {
          registeredTool = handler;
        }
      })
    } as any;
  });

  it('updates page with version number', async () => {
    vi.mocked(pagesApi.updatePage).mockResolvedValue({
      id: '12345',
      title: 'Updated Page',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      version: {
        number: 2,
        createdAt: '2024-01-02T00:00:00.000Z',
        message: 'Updated content'
      },
      _links: {
        webui: '/spaces/DEV/pages/12345',
        editui: '/pages/resumedraft.action?pageId=12345',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerUpdatePageTool(mockServer, mockClient);

    const result = await registeredTool({
      pageId: '12345',
      version: 2,
      title: 'Updated Page',
      body: '<p>Updated content</p>'
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.version).toBe(2);
    expect(data.updatedAt).toBeDefined();
  });

  it('requires version in inputSchema', async () => {
    registerUpdatePageTool(mockServer, mockClient);

    expect(mockServer.tool).toHaveBeenCalled();
    const call = vi.mocked(mockServer.tool).mock.calls[0];
    const schema = call[2];

    expect(schema).toHaveProperty('version');
  });

  it('handles errors (version mismatch)', async () => {
    vi.mocked(pagesApi.updatePage).mockRejectedValue(
      new Error('Version mismatch: expected 2, got 1')
    );

    registerUpdatePageTool(mockServer, mockClient);

    const result = await registeredTool({
      pageId: '12345',
      version: 1
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error updating page');
    expect(result.content[0].text).toContain('version');
  });
});
