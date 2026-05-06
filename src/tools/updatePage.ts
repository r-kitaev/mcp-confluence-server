import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { updatePage } from '../api/pages.js';

const InputSchema = z.object({
  pageId: z.string().describe('ID страницы для обновления'),
  title: z.string().min(1).max(2000).optional()
    .describe('Новый заголовок'),
  body: z.string().optional()
    .describe('Новое содержимое в формате storage'),
  version: z.number().min(1)
    .describe('Текущий номер версии + 1 (обязательно)'),
  representation: z.enum(['storage', 'atlas_doc_format']).default('storage')
    .describe('Формат контента'),
  updateMessage: z.string().optional()
    .describe('Сообщение об изменении для истории версий')
});

export function registerUpdatePageTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'updatePage',
    'Обновить существующую страницу в Confluence. version number обязателен!',
    InputSchema.shape,
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const page = await updatePage(client, args.pageId, {
          title: args.title,
          body: args.body,
          version: args.version,
          representation: args.representation,
          updateMessage: args.updateMessage
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              pageId: page.id,
              title: page.title,
              version: page.version.number,
              updatedAt: page.version.createdAt,
              updateMessage: page.version.message,
              webUrl: page._links.webui
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Error updating page: ${errorMessage}. Убедитесь что version number корректен.`
          }],
          isError: true
        };
      }
    }
  );
}
