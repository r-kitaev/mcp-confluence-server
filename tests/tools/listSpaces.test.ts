import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerListSpacesTool } from '../../src/tools/listSpaces.js';
import * as spacesApi from '../../src/api/spaces.js';

vi.mock('../../src/api/spaces.js', () => ({
  listSpaces: vi.fn()
}));

describe('listSpaces tool', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredTool: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredTool = null;

    mockServer = {
      tool: vi.fn((name, description, schema, annotations, handler) => {
        if (name === 'listSpaces') {
          registeredTool = handler;
        }
      })
    } as any;
  });

  it('returns list of spaces with pagination', async () => {
    vi.mocked(spacesApi.listSpaces).mockResolvedValue({
      results: [
        {
          id: '1',
          key: 'DEV',
          name: 'Development',
          type: 'global',
          status: 'current',
          _links: { webui: '/spaces/DEV', base: 'https://example.atlassian.net/wiki' }
        },
        {
          id: '2',
          key: 'TEST',
          name: 'Testing',
          type: 'global',
          status: 'current',
          _links: { webui: '/spaces/TEST', base: 'https://example.atlassian.net/wiki' }
        }
      ],
      _links: {
        base: 'https://example.atlassian.net/wiki/api/v2',
        next: 'cursor123'
      }
    } as any);

    registerListSpacesTool(mockServer, mockClient);

    const result = await registeredTool({ limit: 25 });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.spaces).toHaveLength(2);
    expect(data.pagination.hasNext).toBe(true);
    expect(data.pagination.nextCursor).toBe('cursor123');
  });

  it('passes limit and cursor to API', async () => {
    vi.mocked(spacesApi.listSpaces).mockResolvedValue({
      results: [],
      _links: { base: 'https://example.atlassian.net/wiki/api/v2' }
    } as any);

    registerListSpacesTool(mockServer, mockClient);
    await registeredTool({ limit: 50, cursor: 'abc123' });

    expect(spacesApi.listSpaces).toHaveBeenCalledWith(mockClient, {
      limit: 50,
      cursor: 'abc123'
    });
  });

  it('works without options (default limit)', async () => {
    vi.mocked(spacesApi.listSpaces).mockResolvedValue({
      results: [],
      _links: { base: 'https://example.atlassian.net/wiki/api/v2' }
    } as any);

    registerListSpacesTool(mockServer, mockClient);
    await registeredTool({ limit: 25 });

    expect(spacesApi.listSpaces).toHaveBeenCalledWith(mockClient, {
      limit: 25,
      cursor: undefined
    });
  });
});
