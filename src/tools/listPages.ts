import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { listPages } from '../api/pages.js';

const InputSchema = z.object({
  spaceId: z.string().describe('ID пространства'),
  parentId: z.string().optional()
    .describe('ID родительской страницы для получения дочерних'),
  limit: z.number().min(1).max(100).default(25),
  cursor: z.string().optional()
});

export function registerListPagesTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'listPages',
    'Получить список страниц в пространстве Confluence',
    InputSchema.shape,
    {
      readOnlyHint: true,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const response = await listPages(client, args.spaceId, {
          parentId: args.parentId,
          limit: args.limit,
          cursor: args.cursor
        });
        
        const hasNext = !!response._links.next;
        const nextCursor = response._links.next;
        
        const pages = response.results.map(page => ({
          id: page.id,
          title: page.title,
          spaceId: page.spaceId,
          parentId: page.parentId,
          position: page.position,
          createdAt: page.createdAt,
          version: page.version.number,
          webUrl: page._links.webui
        }));
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              pages,
              pagination: {
                hasNext,
                nextCursor
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Error listing pages: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
