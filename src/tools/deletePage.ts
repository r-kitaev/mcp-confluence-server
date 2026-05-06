import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { deletePage } from '../api/pages.js';

const InputSchema = z.object({
  pageId: z.string().describe('ID страницы для удаления'),
  purge: z.boolean().default(false)
    .describe('Удалить навсегда (требуется admin). false = переместить в trash')
});

export function registerDeletePageTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'deletePage',
    'Удалить страницу из Confluence',
    InputSchema.shape,
    {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const purge = args.purge ?? false;
        
        await deletePage(client, args.pageId, {
          purge
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              pageId: args.pageId,
              action: purge ? 'permanently_deleted' : 'moved_to_trash'
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Error deleting page: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
