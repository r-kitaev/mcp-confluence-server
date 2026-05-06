import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerSpaceResource } from '../../src/resources/spaceResource.js';
import * as spacesApi from '../../src/api/spaces.js';

vi.mock('../../src/api/spaces.js', () => ({
  getSpace: vi.fn()
}));

describe('spaceResource', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredResource: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredResource = null;

    mockServer = {
      resource: vi.fn((name, uriTemplate, metadata, handler) => {
        if (name === 'space') {
          registeredResource = handler;
        }
      })
    } as any;
  });

  it('returns correct structure on success', async () => {
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

    registerSpaceResource(mockServer, mockClient);

    expect(mockServer.resource).toHaveBeenCalled();
    expect(registeredResource).toBeDefined();

    const uri = new URL('confluence://space/DEV');
    const result = await registeredResource(uri, { spaceId: 'DEV' });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe('application/json');

    const data = JSON.parse(result.contents[0].text);
    expect(data.key).toBe('DEV');
    expect(data.name).toBe('Development');
    expect(data.webUrl).toBe('/spaces/DEV');
  });

  it('handles API errors', async () => {
    vi.mocked(spacesApi.getSpace).mockRejectedValue(new Error('Space not found'));

    registerSpaceResource(mockServer, mockClient);

    const uri = new URL('confluence://space/INVALID');
    await expect(registeredResource(uri, { spaceId: 'INVALID' }))
      .rejects
      .toThrow('Error getting space: Space not found');
  });

  it('calls getSpace with correct spaceId', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '12345',
      key: 'TEST',
      name: 'Test',
      type: 'global',
      status: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      _links: {
        webui: '/spaces/TEST',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerSpaceResource(mockServer, mockClient);

    const uri = new URL('confluence://space/TEST');
    await registeredResource(uri, { spaceId: 'TEST' });

    expect(spacesApi.getSpace).toHaveBeenCalledWith(mockClient, 'TEST');
  });

  it('has correct mimeType: application/json', async () => {
    vi.mocked(spacesApi.getSpace).mockResolvedValue({
      id: '1',
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

    registerSpaceResource(mockServer, mockClient);

    expect(mockServer.resource).toHaveBeenCalledWith(
      'space',
      expect.any(String),
      expect.objectContaining({
        mimeType: 'application/json'
      }),
      expect.any(Function)
    );
  });
});
