import type { ConfluenceClient } from './client.js';
import type { Page, PaginatedResponse } from '../types.js';

export interface GetPageOptions {
  includeBody?: boolean;
  includeLabels?: boolean;
  bodyFormat?: 'storage' | 'view' | 'atlas_doc_format';
}

export interface ListPagesOptions {
  parentId?: string;
  limit?: number;
  cursor?: string;
}

export interface CreatePageData {
  spaceId: string;
  title: string;
  body: string;
  parentId?: string;
  representation?: 'storage' | 'atlas_doc_format';
}

export interface UpdatePageData {
  title?: string;
  body?: string;
  version: number;
  representation?: 'storage' | 'atlas_doc_format';
  updateMessage?: string;
}

export interface DeletePageOptions {
  purge?: boolean;
}

/**
 * Получить страницу по ID
 * @param client - экземпляр ConfluenceClient
 * @param pageId - ID страницы
 * @param options - опции: includeBody, includeLabels, bodyFormat
 * @returns Promise с объектом Page
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getPage(
  client: ConfluenceClient,
  pageId: string,
  options?: GetPageOptions
): Promise<Page> {
  const params = new URLSearchParams();
  if (options?.includeBody) params.set('include-body', 'true');
  if (options?.includeLabels) params.set('include-labels', 'true');
  if (options?.bodyFormat) params.set('body-format', options.bodyFormat);

  const query = params.toString();
  return client.request<Page>('GET', `/pages/${pageId}${query ? `?${query}` : ''}`);
}

/**
 * Получить список страниц в пространстве
 * @param client - экземпляр ConfluenceClient
 * @param spaceId - ID пространства
 * @param options - опции: parentId (фильтр по родительской странице), limit, cursor
 * @returns Promise с PaginatedResponse<Page>
 * @throws ConfluenceAPIError при ошибке API
 */
export async function listPages(
  client: ConfluenceClient,
  spaceId: string,
  options?: ListPagesOptions
): Promise<PaginatedResponse<Page>> {
  const params = new URLSearchParams();
  if (options?.parentId) params.set('parent-id', options.parentId);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('cursor', options.cursor);

  const query = params.toString();
  return client.request<PaginatedResponse<Page>>('GET', `/spaces/${spaceId}/pages${query ? `?${query}` : ''}`);
}

/**
 * Создать новую страницу
 * @param client - экземпляр ConfluenceClient
 * @param data - данные: spaceId, title, body, parentId (опционально), representation
 * @returns Promise с объектом Page
 * @throws ConfluenceAPIError при ошибке API
 */
export async function createPage(
  client: ConfluenceClient,
  data: CreatePageData
): Promise<Page> {
  return client.request<Page>('POST', '/pages', data);
}

/**
 * Обновить существующую страницу
 * @param client - экземпляр ConfluenceClient
 * @param pageId - ID страницы
 * @param data - данные: title (опционально), body (опционально), version (обязательно), representation, updateMessage
 * @returns Promise с объектом Page
 * @throws ConfluenceAPIError при ошибке API
 */
export async function updatePage(
  client: ConfluenceClient,
  pageId: string,
  data: UpdatePageData
): Promise<Page> {
  return client.request<Page>('PUT', `/pages/${pageId}`, data);
}

/**
 * Удалить страницу
 * @param client - экземпляр ConfluenceClient
 * @param pageId - ID страницы
 * @param options - опции: purge (true для полного удаления, false для перемещения в trash)
 * @returns Promise<void>
 * @throws ConfluenceAPIError при ошибке API
 */
export async function deletePage(
  client: ConfluenceClient,
  pageId: string,
  options?: DeletePageOptions
): Promise<void> {
  const params = new URLSearchParams();
  if (options?.purge) params.set('purge', 'true');

  const query = params.toString();
  await client.request<void>('DELETE', `/pages/${pageId}${query ? `?${query}` : ''}`);
}

/**
 * Получить вложения страницы
 * @param client - экземпляр ConfluenceClient
 * @param pageId - ID страницы
 * @param limit - максимальное количество вложений
 * @returns Promise с массивом вложений
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getPageAttachments(
  client: ConfluenceClient,
  pageId: string,
  limit?: number
): Promise<any> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());

  const query = params.toString();
  return client.request<any>('GET', `/pages/${pageId}/attachments${query ? `?${query}` : ''}`);
}

/**
 * Получить комментарии страницы
 * @param client - экземпляр ConfluenceClient
 * @param pageId - ID страницы
 * @param limit - максимальное количество комментариев
 * @returns Promise с массивом комментариев
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getPageComments(
  client: ConfluenceClient,
  pageId: string,
  limit?: number
): Promise<any> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());

  const query = params.toString();
  return client.request<any>('GET', `/pages/${pageId}/comments${query ? `?${query}` : ''}`);
}
