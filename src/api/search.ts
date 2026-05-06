import type { ConfluenceClient } from './client.js';
import type { PaginatedResponse } from '../types.js';

export interface SearchOptions {
  limit?: number;
  cursor?: string;
  includeHighlighting?: boolean;
}

/**
 * Поиск по Confluence с использованием CQL (Confluence Query Language)
 * @param client - экземпляр ConfluenceClient
 * @param cql - CQL запрос (например: 'type = page AND space = DEV' или 'text ~ "API documentation"')
 * @param options - опции: limit, cursor, includeHighlighting
 * @returns Promise с PaginatedResponse<SearchResults>
 * @throws ConfluenceAPIError при ошибке API
 * 
 * @example
 * search(client, 'type = page AND space = DEV')
 * search(client, 'text ~ "API documentation"')
 * search(client, 'creator = currentUser() AND created >= "2024-01-01"')
 */
export async function search(
  client: ConfluenceClient,
  cql: string,
  options?: SearchOptions
): Promise<PaginatedResponse<any>> {
  const params = new URLSearchParams();
  params.set('cql', cql);
  
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('cursor', options.cursor);
  if (options?.includeHighlighting) params.set('highlight', 'true');

  const query = params.toString();
  return client.request<PaginatedResponse<any>>('GET', `/search${query ? `?${query}` : ''}`);
}

/**
 * Поиск по метке
 * @param client - экземпляр ConfluenceClient
 * @param label - метка для поиска
 * @param limit - максимальное количество результатов
 * @returns Promise с PaginatedResponse
 * @throws ConfluenceAPIError при ошибке API
 */
export async function searchByLabel(
  client: ConfluenceClient,
  label: string,
  limit?: number
): Promise<PaginatedResponse<any>> {
  return search(client, `label = "${label}"`, { limit });
}

/**
 * Поиск недавно изменённых страниц
 * @param client - экземпляр ConfluenceClient
 * @param spaceId - опционально, ID пространства для фильтрации
 * @param limit - максимальное количество результатов
 * @returns Promise с PaginatedResponse
 * @throws ConfluenceAPIError при ошибке API
 */
export async function searchRecent(
  client: ConfluenceClient,
  spaceId?: string,
  limit?: number
): Promise<PaginatedResponse<any>> {
  const cql = spaceId
    ? `space = "${spaceId}" AND lastModified >= -7d`
    : 'lastModified >= -7d';
  
  return search(client, cql, { limit });
}
