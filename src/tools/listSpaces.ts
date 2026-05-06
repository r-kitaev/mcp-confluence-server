import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { listSpaces } from '../api/spaces.js';

const InputSchema = z.object({
  limit: z.number().min(1).max(100).default(25)
    .describe('Максимальное количество результатов (1-100)'),
  cursor: z.string().optional()
    .describe('Токен пагинации из предыдущего запроса')
});

export function registerListSpacesTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'listSpaces',
    'Получить список всех пространств Confluence с пагинацией',
    InputSchema.shape,
    {
      readOnlyHint: true,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const response = await listSpaces(client, {
          limit: args.limit,
          cursor: args.cursor
        });
        
        const hasNext = !!response._links.next;
        const nextCursor = response._links.next;
        
        const spaces = response.results.map(space => ({
          id: space.id,
          key: space.key,
          name: space.name,
          type: space.type,
          status: space.status,
          webUrl: space._links.webui
        }));
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              spaces,
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
            text: `Error listing spaces: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
