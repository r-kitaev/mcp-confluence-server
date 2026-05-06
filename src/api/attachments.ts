import type { ConfluenceClient } from './client.js';
import type { AttachmentResponse } from '../types.js';

export interface UploadAttachmentData {
  filename: string;
  content: Buffer;
  mimeType: string;
}

/**
 * Получить метаданные вложения
 * @param client - экземпляр ConfluenceClient
 * @param attachmentId - ID вложения
 * @returns Promise с объектом Attachment
 * @throws ConfluenceAPIError при ошибке API
 */
export async function getAttachment(
  client: ConfluenceClient,
  attachmentId: string
): Promise<AttachmentResponse> {
  return client.request<AttachmentResponse>('GET', `/attachments/${attachmentId}`);
}

/**
 * Скачать вложение (бинарные данные)
 * @param client - экземпляр ConfluenceClient
 * @param attachmentId - ID вложения
 * @returns Promise с Buffer содержащим данные файла
 * @throws ConfluenceAPIError при ошибке API
 */
export async function downloadAttachment(
  client: ConfluenceClient,
  attachmentId: string
): Promise<Buffer> {
  return client.downloadBinary(`/attachments/${attachmentId}/download`);
}

/**
 * Загрузить вложение на страницу
 * @param client - экземпляр ConfluenceClient
 * @param pageId - ID страницы
 * @param file - данные файла: filename, content (Buffer), mimeType
 * @param comment - опционально, комментарий к версии
 * @returns Promise с объектом вложения
 * @throws ConfluenceAPIError при ошибке API
 */
export async function uploadAttachment(
  client: ConfluenceClient,
  pageId: string,
  file: UploadAttachmentData,
  comment?: string
): Promise<AttachmentResponse> {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  
  const headerParts = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${file.filename}"`,
    `Content-Type: ${file.mimeType}`,
    ''
  ];

  if (comment) {
    headerParts.push(`--${boundary}`);
    headerParts.push('Content-Disposition: form-data; name="comment"');
    headerParts.push('');
    headerParts.push(comment);
  }

  const headerBuffer = Buffer.from(headerParts.join('\r\n') + '\r\n', 'utf-8');
  const footerBuffer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
  const body = Buffer.concat([headerBuffer, file.content, footerBuffer]);

  return client.request<AttachmentResponse>('POST', `/content/${pageId}/child/attachment`, body, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`
  });
}

/**
 * Обновить содержимое вложения
 * @param client - экземпляр ConfluenceClient
 * @param attachmentId - ID вложения
 * @param file - данные файла: filename, content (Buffer), mimeType
 * @param comment - опционально, комментарий к версии
 * @returns Promise с объектом вложения
 * @throws ConfluenceAPIError при ошибке API
 */
export async function updateAttachment(
  client: ConfluenceClient,
  attachmentId: string,
  file: UploadAttachmentData,
  comment?: string
): Promise<AttachmentResponse> {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  
  const headerParts = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${file.filename}"`,
    `Content-Type: ${file.mimeType}`,
    ''
  ];

  if (comment) {
    headerParts.push(`--${boundary}`);
    headerParts.push('Content-Disposition: form-data; name="comment"');
    headerParts.push('');
    headerParts.push(comment);
  }

  const headerBuffer = Buffer.from(headerParts.join('\r\n') + '\r\n', 'utf-8');
  const footerBuffer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
  const body = Buffer.concat([headerBuffer, file.content, footerBuffer]);

  return client.request<AttachmentResponse>('PUT', `/attachments/${attachmentId}/data`, body, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`
  });
}

/**
 * Удалить вложение
 * @param client - экземпляр ConfluenceClient
 * @param attachmentId - ID вложения
 * @returns Promise<void>
 * @throws ConfluenceAPIError при ошибке API
 */
export async function deleteAttachment(
  client: ConfluenceClient,
  attachmentId: string
): Promise<void> {
  await client.request<void>('DELETE', `/attachments/${attachmentId}`);
}
