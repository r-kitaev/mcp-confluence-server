import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerGetSpaceTool } from '../../src/tools/getSpace.js';
import * as spacesApi from '../../src/api/spaces.js';

vi.mock('../../src/api/spaces.js', () => ({
  getSpace: vi.fn()
}));

describe('getSpace tool', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredTool: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredTool = null;

    mockServer = {
      tool: vi.fn((name, description, schema, annotations, handler) => {
        if (name === 'getSpace') {
          registeredTool = handler;
        }
      })
    } as any;
  });

  it('returns correct structure on success', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
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
    } as any);

    registerGetSpaceTool(mockServer, mockClient);

    expect(mockServer.tool).toHaveBeenCalled();
    expect(registeredTool).toBeDefined();

    const result = await registeredTool({ spaceId: 'TEST' });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe('12345');
    expect(data.key).toBe('TEST');
    expect(data.name).toBe('Test Space');
    expect(data.webUrl).toBe('/spaces/TEST');
  });

  it('handles API errors with isError: true', async () => {
    vi.mocked(spacesApi.getSpace).mockRejectedValue(new Error('Space not found'));

    registerGetSpaceTool(mockServer, mockClient);

    const result = await registeredTool({ spaceId: 'INVALID' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error getting space: Space not found');
  });

  it('calls getSpace with correct spaceId', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'DEV',
      name: 'Development',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/DEV',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerGetSpaceTool(mockServer, mockClient);
    await registeredTool({ spaceId: 'DEV' });

    expect(spacesApi.getSpace).toHaveBeenCalledWith(mockClient, 'DEV');
  });
});
