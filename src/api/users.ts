import type { ConfluenceClient } from './client.js';
import type { UserResponse, UsersListResponse } from '../types.js';

/**
 * Получить данные текущего пользователя
 * @param client - экземпляр ConfluenceClient
 * @returns Promise с объектом User
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getCurrentUser(client: ConfluenceClient): Promise<UserResponse> {
  return client.request<UserResponse>('GET', '/user/current');
}

/**
 * Проверить доступ пользователя по email
 * @param client - экземпляр ConfluenceClient
 * @param email - email пользователя
 * @returns Promise с информацией о доступе пользователя
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getUserByEmail(
  client: ConfluenceClient,
  email: string
): Promise<UserResponse> {
  const params = new URLSearchParams();
  params.set('email', email);
  return client.request<UserResponse>('GET', `/user/anonymous?${params.toString()}`);
}

/**
 * Массовое получение пользователей по ID
 * @param client - экземпляр ConfluenceClient
 * @param userIds - массив accountId пользователей
 * @returns Promise с массивом пользователей
 * @throws ConfluenceAPIError при ошибке API
 */
export async function bulkGetUsers(
  client: ConfluenceClient,
  userIds: string[]
): Promise<UsersListResponse> {
  const params = new URLSearchParams();
  userIds.forEach(id => params.append('accountId', id));
  return client.request<UsersListResponse>('GET', `/users/bulk?${params.toString()}`);
}

/**
 * Отправить приглашение пользователю
 * @param client - экземпляр ConfluenceClient
 * @param email - email для приглашения
 * @returns Promise с результатом приглашения
 * @throws ConfluenceAPIError при ошибке API
 */
export async function inviteUser(
  _client: ConfluenceClient,
  _email: string
): Promise<UserResponse> {
  throw new Error('inviteUser not supported in REST API v1');
}
