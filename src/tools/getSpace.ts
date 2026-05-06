import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getSpace } from '../api/spaces.js';

const InputSchema = z.object({
  spaceId: z.string()
    .describe('ID или ключ пространства (например, "DEV" или "12345")')
});

export function registerGetSpaceTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'getSpace',
    'Получить информацию о пространстве Confluence по ID или ключу',
    InputSchema.shape,
    {
      readOnlyHint: true,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const space = await getSpace(client, args.spaceId);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: space.id,
              key: space.key,
              name: space.name,
              type: space.type,
              status: space.status,
              createdAt: space.createdAt,
              webUrl: space._links.webui
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Error getting space: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
