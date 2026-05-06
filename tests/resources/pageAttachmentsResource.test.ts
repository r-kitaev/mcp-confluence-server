import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../../src/api/client.js';
import { registerPageAttachmentsResource } from '../../src/resources/pageAttachmentsResource.js';
import * as pagesApi from '../../src/api/pages.js';

vi.mock('../../src/api/pages.js', () => ({
  getPageAttachments: vi.fn()
}));

describe('pageAttachmentsResource', () => {
  let mockServer: McpServer;
  let mockClient: ConfluenceClient;
  let registeredResource: any;

  beforeEach(() => {
    mockClient = {} as ConfluenceClient;
    registeredResource = null;

    mockServer = {
      resource: vi.fn((name, uriTemplate, metadata, handler) => {
        if (name === 'page-attachments') {
          registeredResource = handler;
        }
      })
    } as any;
  });

  it('returns list of attachments', async () => {
    vi.mocked(pagesApi.getPageAttachments).mockResolvedValue({
      results: [
        {
          id: 'att1',
          title: 'file.pdf',
          mediaType: 'application/pdf',
          fileSize: 1024,
          _links: {
            download: '/download/att1'
          }
        },
        {
          id: 'att2',
          title: 'image.png',
          mediaType: 'image/png',
          fileSize: 2048,
          _links: {
            download: '/download/att2'
          }
        }
      ],
      _links: {
        base: 'https://example.atlassian.net/wiki/api/v2'
      }
    } as any);

    registerPageAttachmentsResource(mockServer, mockClient);

    const uri = new URL('confluence://page/12345/attachments');
    const result = await registeredResource(uri, { pageId: '12345' });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe('application/json');

    const data = JSON.parse(result.contents[0].text);
    expect(data.attachments).toHaveLength(2);
    expect(data.pageId).toBe('12345');
  });

  it('has correct response structure', async () => {
    vi.mocked(pagesApi.getPageAttachments).mockResolvedValue({
      results: [
        {
          id: 'att1',
          title: 'file.pdf',
          mediaType: 'application/pdf',
          fileSize: 1024,
          _links: {
            download: '/download/att1'
          }
        }
      ],
      _links: {
        base: 'https://example.atlassian.net/wiki/api/v2'
      }
    } as any);

    registerPageAttachmentsResource(mockServer, mockClient);

    const uri = new URL('confluence://page/12345/attachments');
    const result = await registeredResource(uri, { pageId: '12345' });

    const data = JSON.parse(result.contents[0].text);
    expect(data).toHaveProperty('pageId');
    expect(data).toHaveProperty('attachments');
    expect(data).toHaveProperty('total');
    expect(data.attachments[0]).toHaveProperty('id');
    expect(data.attachments[0]).toHaveProperty('title');
    expect(data.attachments[0]).toHaveProperty('mediaType');
    expect(data.attachments[0]).toHaveProperty('fileSize');
    expect(data.attachments[0]).toHaveProperty('downloadLink');
  });

  it('handles API errors', async () => {
    vi.mocked(pagesApi.getPageAttachments).mockRejectedValue(new Error('Page not found'));

    registerPageAttachmentsResource(mockServer, mockClient);

    const uri = new URL('confluence://page/INVALID/attachments');
    await expect(registeredResource(uri, { pageId: 'INVALID' }))
      .rejects
      .toThrow('Error getting attachments: Page not found');
  });
});
