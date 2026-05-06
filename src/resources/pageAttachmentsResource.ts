import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getPageAttachments } from '../api/pages.js';

/**
 * Зарегистрировать ресурс для доступа к вложениям страницы
 * @param server - экземпляр McpServer
 * @param client - экземпляр ConfluenceClient
 */
export function registerPageAttachmentsResource(server: McpServer, client: ConfluenceClient): void {
  server.resource(
    'page-attachments',
    'confluence://page/{pageId}/attachments',
    {
      title: 'Page Attachments',
      description: 'Список вложений страницы Confluence',
      mimeType: 'application/json'
    },
    async (uri, params) => {
      try {
        const paramsRecord = params as Record<string, unknown>;
        const pageId = paramsRecord.pageId as string;
        const response = await getPageAttachments(client, pageId, 50);

        const attachments = response.results?.map((attachment: unknown) => {
          const att = attachment as Record<string, unknown>;
          const links = att._links as Record<string, unknown> | undefined;
          return {
            id: att.id as string,
            title: att.title as string,
            mediaType: att.mediaType as string,
            fileSize: att.fileSize as number,
            downloadLink: (links?.download as string) || (att.downloadLink as string)
          };
        }) || [];

        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({
              pageId,
              attachments,
              total: attachments.length
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Error getting attachments: ${errorMessage}`);
      }
    }
  );
}
