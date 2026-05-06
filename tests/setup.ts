import { ConfluenceClient } from '../src/api/client.js';

declare global {
  var mockConfluenceClient: ConfluenceClient | null;
}

global.mockConfluenceClient = null;

export function createMockResponse<T>(data: T, nextLink?: string): { results: T; _links: { next?: string; base: string } } {
  return {
    results: data,
    _links: {
      ...(nextLink ? { next: nextLink } : {}),
      base: 'https://example.atlassian.net/wiki/api/v2'
    }
  };
}

export function createMockSpace(overrides?: Partial<any>): any {
  return {
    id: '12345',
    key: 'TEST',
    name: 'Test Space',
    type: 'global',
    status: 'current',
    createdAt: '2024-01-01T00:00:00.000Z',
    _links: {
      webui: '/spaces/TEST',
      base: 'https://example.atlassian.net/wiki'
    },
    ...overrides
  };
}

export function createMockPage(overrides?: Partial<any>): any {
  return {
    id: '67890',
    title: 'Test Page',
    spaceId: '12345',
    position: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    version: {
      number: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      message: 'Initial version'
    },
    _links: {
      webui: '/spaces/TEST/pages/67890',
      editui: '/pages/resumedraft.action?pageId=67890',
      base: 'https://example.atlassian.net/wiki'
    },
    ...overrides
  };
}

import { afterEach } from 'vitest';

afterEach(() => {
  global.mockConfluenceClient = null;
});
