import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { createPage } from '../api/pages.js';

const InputSchema = z.object({
  spaceId: z.string().describe('ID пространства'),
  title: z.string().min(1).max(2000)
    .describe('Заголовок страницы'),
  body: z.string()
    .describe('Содержимое в формате Confluence storage (XHTML)'),
  parentId: z.string().optional()
    .describe('ID родительской страницы для иерархии'),
  representation: z.enum(['storage', 'atlas_doc_format']).default('storage')
    .describe('Формат контента')
});

export function registerCreatePageTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'createPage',
    'Создать новую страницу в Confluence',
    InputSchema.shape,
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const page = await createPage(client, {
          spaceId: args.spaceId,
          title: args.title,
          body: args.body,
          parentId: args.parentId,
          representation: args.representation
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              pageId: page.id,
              title: page.title,
              spaceId: page.spaceId,
              version: page.version.number,
              webUrl: page._links.webui,
              editUrl: page._links.editui
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Error creating page: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
