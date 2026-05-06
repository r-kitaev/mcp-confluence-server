import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerDeletePageTool } from '../../src/tools/deletePage.js';
import * as pagesApi from '../../src/api/pages.js';

vi.mock('../../src/api/pages.js', () => ({
  deletePage: vi.fn()
}));

describe('deletePage tool', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredTool: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredTool = null;

    mockServer = {
      tool: vi.fn((name, description, schema, annotations, handler) => {
        if (name === 'deletePage') {
          registeredTool = handler;
        }
      })
    } as any;
  });

  it('deletes page with purge: false (default)', async () => {
    vi.mocked(pagesApi.deletePage).mockResolvedValue(undefined);

    registerDeletePageTool(mockServer, mockClient);

    const result = await registeredTool({
      pageId: '12345'
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.pageId).toBe('12345');
    expect(data.action).toBe('moved_to_trash');

    expect(pagesApi.deletePage).toHaveBeenCalledWith(mockClient, '12345', expect.objectContaining({
      purge: false
    }));
  });

  it('deletes page with purge: true', async () => {
    vi.mocked(pagesApi.deletePage).mockResolvedValue(undefined);

    registerDeletePageTool(mockServer, mockClient);

    const result = await registeredTool({
      pageId: '12345',
      purge: true
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.action).toBe('permanently_deleted');

    expect(pagesApi.deletePage).toHaveBeenCalledWith(mockClient, '12345', {
      purge: true
    });
  });

  it('returns correct action in response', async () => {
    vi.mocked(pagesApi.deletePage).mockResolvedValue(undefined);

    registerDeletePageTool(mockServer, mockClient);

    const resultTrash = await registeredTool({ pageId: '12345' });
    const dataTrash = JSON.parse(resultTrash.content[0].text);
    expect(dataTrash.action).toBe('moved_to_trash');

    const resultPurge = await registeredTool({ pageId: '12345', purge: true });
    const dataPurge = JSON.parse(resultPurge.content[0].text);
    expect(dataPurge.action).toBe('permanently_deleted');
  });
});
