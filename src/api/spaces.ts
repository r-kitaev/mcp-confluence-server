import type { ConfluenceClient } from './client.js';
import type { SpaceResponse, SpacesListResponse, PermissionsResponse } from '../types.js';

export interface CreateSpaceData {
  key: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface ListSpacesOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Получить пространство Confluence по ID или ключу
 * @param client - экземпляр ConfluenceClient
 * @param spaceId - ID или ключ пространства (например, 'DEV' или '12345')
 * @returns Promise с объектом Space
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getSpace(client: ConfluenceClient, spaceId: string): Promise<SpaceResponse> {
  return client.request<SpaceResponse>('GET', `/space/${spaceId}`);
}

/**
 * Получить список пространств с пагинацией
 * @param client - экземпляр ConfluenceClient
 * @param options - опции: limit (1-100, default 25), cursor (токен пагинации)
 * @returns Promise с PaginatedResponse<Space>
 * @throws ConfluenceAPIError при ошибке API
 */
export async function listSpaces(
  client: ConfluenceClient,
  options?: ListSpacesOptions
): Promise<SpacesListResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('cursor', options.cursor);

  const query = params.toString();
  return client.request<SpacesListResponse>('GET', `/space${query ? `?${query}` : ''}`);
}

/**
 * Создать новое пространство
 * @param client - экземпляр ConfluenceClient
 * @param data - данные: key (уникальная строка), name, description (опционально), isPrivate (default false)
 * @returns Promise с объектом Space
 * @throws ConfluenceAPIError при ошибке API
 */
export async function createSpace(
  client: ConfluenceClient,
  data: CreateSpaceData
): Promise<SpaceResponse> {
  return client.request<SpaceResponse>('POST', '/space', data);
}

/**
 * Получить разрешения пространства
 * @param client - экземпляр ConfluenceClient
 * @param spaceId - ID или ключ пространства
 * @returns Promise с массивом разрешений
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getSpacePermissions(
  client: ConfluenceClient,
  spaceId: string
): Promise<PermissionsResponse> {
  return client.request<PermissionsResponse>('GET', `/space/${spaceId}/permissions`);
}
