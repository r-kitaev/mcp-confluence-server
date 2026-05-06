import type { ConfluenceClient } from './client.js';
import type { UserResponse, UsersListResponse } from '../types.js';

/**
 * Получить данные текущего пользователя
 * @param client - экземпляр ConfluenceClient
 * @returns Promise с объектом User
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getCurrentUser(client: ConfluenceClient): Promise<UserResponse> {
  return client.request<UserResponse>('GET', '/users/me');
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
  return client.request<UserResponse>('POST', '/user/access/check-access-by-email', { email });
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
  return client.request<UsersListResponse>('POST', '/users-bulk', { accountIds: userIds });
}

/**
 * Отправить приглашение пользователю
 * @param client - экземпляр ConfluenceClient
 * @param email - email для приглашения
 * @returns Promise с результатом приглашения
 * @throws ConfluenceAPIError при ошибке API
 */
export async function inviteUser(
  client: ConfluenceClient,
  email: string
): Promise<UserResponse> {
  return client.request<UserResponse>('POST', '/user/access/invite-by-email', { email });
}
