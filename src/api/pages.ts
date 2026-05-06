import type { ConfluenceClient } from './client.js';
import type { PageResponse, PagesListResponse, CommentsListResponse, AttachmentsListResponse, PageWithBody } from '../types.js';

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
 * @returns Promise с объектом Page или PageWithBody (если includeBody=true)
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getPage(
  client: ConfluenceClient,
  pageId: string,
  options?: GetPageOptions
): Promise<PageResponse | PageWithBody> {
  const params = new URLSearchParams();
  if (options?.includeBody) params.set('include-body', 'true');
  if (options?.includeLabels) params.set('include-labels', 'true');
  if (options?.bodyFormat) params.set('body-format', options.bodyFormat);
  
  const query = params.toString();
  return client.request<PageResponse | PageWithBody>('GET', `/content/${pageId}${query ? `?${query}` : ''}`);
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
): Promise<PagesListResponse> {
  const params = new URLSearchParams();
  params.set('spaceKey', spaceId);
  params.set('type', 'page');
  if (options?.parentId) params.set('parent-id', options.parentId);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('start', options.cursor);
  
  const query = params.toString();
  return client.request<PagesListResponse>('GET', `/content${query ? `?${query}` : ''}`);
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
): Promise<PageResponse> {
  const payload: any = {
    type: 'page',
    title: data.title,
    space: { key: data.spaceId },
    body: {
      [data.representation || 'storage']: {
        value: data.body,
        representation: data.representation || 'storage'
      }
    }
  };
  
  if (data.parentId) {
    payload.ancestors = [{ id: data.parentId }];
  }
  
  return client.request<PageResponse>('POST', '/content', payload);
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
): Promise<PageResponse> {
  const payload: any = {
    title: data.title,
    version: { number: data.version, minorEdit: true, message: data.updateMessage || '' }
  };
  
  if (data.body) {
    payload.body = {
      [data.representation || 'storage']: {
        value: data.body,
        representation: data.representation || 'storage'
      }
    };
  }
  
  return client.request<PageResponse>('PUT', `/content/${pageId}`, payload);
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
  await client.request<void>('DELETE', `/content/${pageId}${query ? `?${query}` : ''}`);
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
): Promise<AttachmentsListResponse> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  
  const query = params.toString();
  return client.request<AttachmentsListResponse>('GET', `/content/${pageId}/child/attachment${query ? `?${query}` : ''}`);
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
): Promise<CommentsListResponse> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  
  const query = params.toString();
  return client.request<CommentsListResponse>('GET', `/content/${pageId}/child/comment${query ? `?${query}` : ''}`);
}
