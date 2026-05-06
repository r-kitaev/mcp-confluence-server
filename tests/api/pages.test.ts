import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfluenceClient } from '../../src/api/client.js';
import * as pagesApi from '../../src/api/pages.js';
import type { Page, PaginatedResponse } from '../../src/types.js';

describe('pages API', () => {
  let mockClient: ConfluenceClient;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    mockClient = {
      request: mockRequest
    } as unknown as ConfluenceClient;
  });

  describe('getPage', () => {
    it('calls with options (includeBody, includeLabels)', async () => {
      const mockPage: Page = {
        id: '67890',
        title: 'Test Page',
        spaceId: '12345',
        position: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        version: {
          number: 1,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        _links: {
          webui: '/spaces/TEST/pages/67890',
          editui: '/pages/resumedraft.action?pageId=67890',
          base: 'https://example.atlassian.net/wiki'
        }
      };

      mockRequest.mockResolvedValue(mockPage);

      await pagesApi.getPage(mockClient, '67890', {
        includeBody: true,
        includeLabels: true,
        bodyFormat: 'storage'
      });

      expect(mockRequest).toHaveBeenCalledWith('GET', '/pages/67890?include-body=true&include-labels=true&body-format=storage');
    });

    it('works without options', async () => {
      const mockPage: Page = {
        id: '67890',
        title: 'Test Page',
        spaceId: '12345',
        position: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        version: {
          number: 1,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        _links: {
          webui: '/spaces/TEST/pages/67890',
          editui: '/pages/resumedraft.action?pageId=67890',
          base: 'https://example.atlassian.net/wiki'
        }
      };

      mockRequest.mockResolvedValue(mockPage);

      await pagesApi.getPage(mockClient, '67890');

      expect(mockRequest).toHaveBeenCalledWith('GET', '/pages/67890');
    });
  });

  describe('listPages', () => {
    it('filters by parentId', async () => {
      const mockResponse: PaginatedResponse<Page> = {
        results: [],
        _links: {
          base: 'https://example.atlassian.net/wiki/api/v2'
        }
      };

      mockRequest.mockResolvedValue(mockResponse);

      await pagesApi.listPages(mockClient, '12345', { parentId: '67890' });

      expect(mockRequest).toHaveBeenCalledWith('GET', '/spaces/12345/pages?parent-id=67890');
    });

    it('passes limit and cursor', async () => {
      const mockResponse: PaginatedResponse<Page> = {
        results: [],
        _links: {
          base: 'https://example.atlassian.net/wiki/api/v2'
        }
      };

      mockRequest.mockResolvedValue(mockResponse);

      await pagesApi.listPages(mockClient, '12345', { limit: 25, cursor: 'xyz789' });

      expect(mockRequest).toHaveBeenCalledWith('GET', '/spaces/12345/pages?limit=25&cursor=xyz789');
    });
  });

  describe('createPage', () => {
    it('creates page with parentId', async () => {
      const mockPage: Page = {
        id: '11111',
        title: 'Child Page',
        spaceId: '12345',
        parentId: '67890',
        position: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        version: {
          number: 1,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        _links: {
          webui: '/spaces/TEST/pages/11111',
          editui: '/pages/resumedraft.action?pageId=11111',
          base: 'https://example.atlassian.net/wiki'
        }
      };

      mockRequest.mockResolvedValue(mockPage);

      const pageData = {
        spaceId: '12345',
        title: 'Child Page',
        body: '<p>Content</p>',
        parentId: '67890',
        representation: 'storage' as const
      };

      await pagesApi.createPage(mockClient, pageData);

      expect(mockRequest).toHaveBeenCalledWith('POST', '/pages', pageData);
    });

    it('creates page without parentId', async () => {
      const mockPage: Page = {
        id: '22222',
        title: 'Root Page',
        spaceId: '12345',
        position: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        version: {
          number: 1,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        _links: {
          webui: '/spaces/TEST/pages/22222',
          editui: '/pages/resumedraft.action?pageId=22222',
          base: 'https://example.atlassian.net/wiki'
        }
      };

      mockRequest.mockResolvedValue(mockPage);

      const pageData = {
        spaceId: '12345',
        title: 'Root Page',
        body: '<p>Content</p>'
      };

      await pagesApi.createPage(mockClient, pageData);

      expect(mockRequest).toHaveBeenCalledWith('POST', '/pages', pageData);
    });
  });

  describe('updatePage', () => {
    it('requires version number', async () => {
      const mockPage: Page = {
        id: '67890',
        title: 'Updated Page',
        spaceId: '12345',
        position: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        version: {
          number: 2,
          createdAt: '2024-01-02T00:00:00.000Z',
          message: 'Updated content'
        },
        _links: {
          webui: '/spaces/TEST/pages/67890',
          editui: '/pages/resumedraft.action?pageId=67890',
          base: 'https://example.atlassian.net/wiki'
        }
      };

      mockRequest.mockResolvedValue(mockPage);

      const updateData = {
        title: 'Updated Page',
        body: '<p>Updated content</p>',
        version: 2,
        updateMessage: 'Updated content'
      };

      await pagesApi.updatePage(mockClient, '67890', updateData);

      expect(mockRequest).toHaveBeenCalledWith('PUT', '/pages/67890', updateData);
    });
  });

  describe('deletePage', () => {
    it('deletes with purge=false by default', async () => {
      mockRequest.mockResolvedValue(undefined);

      await pagesApi.deletePage(mockClient, '67890');

      expect(mockRequest).toHaveBeenCalledWith('DELETE', '/pages/67890');
    });

    it('deletes with purge=true', async () => {
      mockRequest.mockResolvedValue(undefined);

      await pagesApi.deletePage(mockClient, '67890', { purge: true });

      expect(mockRequest).toHaveBeenCalledWith('DELETE', '/pages/67890?purge=true');
    });
  });
});
