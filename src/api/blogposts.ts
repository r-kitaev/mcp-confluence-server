import type { ConfluenceClient } from './client.js';
import type { BlogPostResponse, BlogPostsListResponse } from '../types.js';

export interface GetBlogPostOptions {
  includeBody?: boolean;
  bodyFormat?: 'storage' | 'view';
}

export interface ListBlogPostsOptions {
  limit?: number;
  cursor?: string;
}

export interface CreateBlogPostData {
  spaceId: string;
  title: string;
  body: string;
  representation?: 'storage' | 'atlas_doc_format';
}

export interface UpdateBlogPostData {
  title?: string;
  body?: string;
  version: number;
}

/**
 * Получить блог-пост по ID
 * @param client - экземпляр ConfluenceClient
 * @param blogPostId - ID блог-поста
 * @param options - опции: includeBody, bodyFormat
 * @returns Promise с объектом блог-поста
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getBlogPost(
  client: ConfluenceClient,
  blogPostId: string,
  options?: GetBlogPostOptions
): Promise<BlogPostResponse> {
  const params = new URLSearchParams();
  if (options?.includeBody) params.set('include-body', 'true');
  if (options?.bodyFormat) params.set('body-format', options.bodyFormat);

  const query = params.toString();
  return client.request<BlogPostResponse>('GET', `/blogposts/${blogPostId}${query ? `?${query}` : ''}`);
}

/**
 * Получить список блог-постов
 * @param client - экземпляр ConfluenceClient
 * @param spaceId - опционально, ID пространства для фильтрации
 * @param options - опции: limit, cursor
 * @returns Promise с PaginatedResponse
 * @throws ConfluenceAPIError при ошибке API
 */
export async function listBlogPosts(
  client: ConfluenceClient,
  spaceId?: string,
  options?: ListBlogPostsOptions
): Promise<BlogPostsListResponse> {
  const params = new URLSearchParams();
  if (spaceId) params.set('space-id', spaceId);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('cursor', options.cursor);

  const query = params.toString();
  return client.request<BlogPostsListResponse>('GET', `/blogposts${query ? `?${query}` : ''}`);
}

/**
 * Создать новый блог-пост
 * @param client - экземпляр ConfluenceClient
 * @param data - данные: spaceId, title, body, representation
 * @returns Promise с объектом блог-поста
 * @throws ConfluenceAPIError при ошибке API
 */
export async function createBlogPost(
  client: ConfluenceClient,
  data: CreateBlogPostData
): Promise<BlogPostResponse> {
  return client.request<BlogPostResponse>('POST', '/blogposts', data);
}

/**
 * Обновить существующий блог-пост
 * @param client - экземпляр ConfluenceClient
 * @param blogPostId - ID блог-поста
 * @param data - данные: title, body, version (обязательно)
 * @returns Promise с объектом блог-поста
 * @throws ConfluenceAPIError при ошибке API
 */
export async function updateBlogPost(
  client: ConfluenceClient,
  blogPostId: string,
  data: UpdateBlogPostData
): Promise<BlogPostResponse> {
  return client.request<BlogPostResponse>('PUT', `/blogposts/${blogPostId}`, data);
}

/**
 * Удалить блог-пост
 * @param client - экземпляр ConfluenceClient
 * @param blogPostId - ID блог-поста
 * @returns Promise<void>
 * @throws ConfluenceAPIError при ошибке API
 */
export async function deleteBlogPost(
  client: ConfluenceClient,
  blogPostId: string
): Promise<void> {
  await client.request<void>('DELETE', `/blogposts/${blogPostId}`);
}
