import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerPageResource } from '../../src/resources/pageResource.js';
import * as pagesApi from '../../src/api/pages.js';

vi.mock('../../src/api/pages.js', () => ({
  getPage: vi.fn()
}));

describe('pageResource', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredResource: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredResource = null;

    mockServer = {
      resource: vi.fn((name, uriTemplate, metadata, handler) => {
        if (name === 'page') {
          registeredResource = handler;
        }
      })
    } as any;
  });

  it('returns markdown content for page', async () => {
    vi.mocked(pagesApi.getPage).mockResolvedValue({
      id: '12345',
      title: 'Test Page',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      version: {
        number: 1,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      body: {
        view: {
          value: '<h1>Title</h1><p>Content</p>'
        }
      },
      _links: {
        webui: '/spaces/DEV/pages/12345',
        editui: '/pages/resumedraft.action?pageId=12345',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerPageResource(mockServer, mockClient);

    const uri = new URL('confluence://page/12345');
    const result = await registeredResource(uri, { pageId: '12345' });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe('text/markdown');
    expect(result.contents[0].text).toContain('# Test Page');
  });

  it('converts HTML to markdown correctly', async () => {
    vi.mocked(pagesApi.getPage).mockResolvedValue({
      id: '12345',
      title: 'Test',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      version: {
        number: 1,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      body: {
        view: {
          value: '<h1>Title</h1><p>Text with <strong>bold</strong> and <em>italic</em></p>'
        }
      },
      _links: {
        webui: '/url',
        editui: '/edit',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerPageResource(mockServer, mockClient);

    const uri = new URL('confluence://page/12345');
    const result = await registeredResource(uri, { pageId: '12345' });

    const markdown = result.contents[0].text;
    expect(markdown).toContain('# Title');
    expect(markdown).toContain('**bold**');
    expect(markdown).toContain('*italic*');
  });

  it('handles API errors', async () => {
    vi.mocked(pagesApi.getPage).mockRejectedValue(new Error('Page not found'));

    registerPageResource(mockServer, mockClient);

    const uri = new URL('confluence://page/INVALID');
    await expect(registeredResource(uri, { pageId: 'INVALID' }))
      .rejects
      .toThrow('Error getting page: Page not found');
  });

  it('has correct mimeType: text/markdown', async () => {
    vi.mocked(pagesApi.getPage).mockResolvedValue({
      id: '12345',
      title: 'Test',
      spaceId: 'DEV',
      position: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      version: {
        number: 1,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      body: {
        view: {
          value: '<p>Content</p>'
        }
      },
      _links: {
        webui: '/url',
        editui: '/edit',
        base: 'https://example.atlassian.net/wiki'
      }
    } as any);

    registerPageResource(mockServer, mockClient);

    expect(mockServer.resource).toHaveBeenCalledWith(
      'page',
      expect.any(String),
      expect.objectContaining({
        mimeType: 'text/markdown'
      }),
      expect.any(Function)
    );
  });
});
