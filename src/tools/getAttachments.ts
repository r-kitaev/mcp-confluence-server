import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getPageAttachments } from '../api/pages.js';
import type { AttachmentsListResponse } from '../types.js';

const InputSchema = z.object({
  pageId: z.string().describe('ID страницы'),
  limit: z.number().min(1).max(100).default(25)
});

export function registerGetAttachmentsTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'getAttachments',
    'Получить список вложений страницы Confluence',
    InputSchema.shape,
    {
      readOnlyHint: true,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const response = await getPageAttachments(client, args.pageId, args.limit) as AttachmentsListResponse;
        
        const attachments = response.results?.map((attachment) => ({
          id: attachment.id,
          title: attachment.title,
          mediaType: attachment.mediaType,
          fileSize: attachment.fileSize,
          downloadLink: attachment.downloadLink
        })) || [];
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              attachments,
              pagination: {
                total: attachments.length
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Error getting attachments: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
