import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getPage } from '../api/pages.js';

const InputSchema = z.object({
  pageId: z.string().describe('ID страницы'),
  includeBody: z.boolean().default(true)
    .describe('Включить содержимое страницы'),
  includeLabels: z.boolean().default(false)
    .describe('Включить метки'),
  bodyFormat: z.enum(['storage', 'view']).default('view')
    .describe('Формат контента: storage (raw) или view (rendered)')
});

export function registerGetPageTool(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    'getPage',
    'Получить информацию о странице Confluence по ID',
    InputSchema.shape,
    {
      readOnlyHint: true,
      openWorldHint: false
    },
    async (args: z.infer<typeof InputSchema>) => {
      try {
        const page = await getPage(client, args.pageId, {
          includeBody: args.includeBody,
          includeLabels: args.includeLabels,
          bodyFormat: args.bodyFormat
        });
        
        const result: Record<string, unknown> = {
          id: page.id,
          title: page.title,
          version: (page as any).version?.number || 1,
          webUrl: page._links.webui
        };
        
        if ((page as any).space?.key) {
          result.spaceId = (page as any).space.key;
        }
        
        if ((page as any).ancestors && (page as any).ancestors.length > 0) {
          result.parentId = (page as any).ancestors[0].id;
        }
        
        if (args.includeBody) {
          const bodyData = (page as any).body?.storage?.value || (page as any).body?.view?.value;
          result.body = bodyData || 'No body content';
        }
        
        if (args.includeLabels) {
          result.labels = 'Labels available (implement labels retrieval)';
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Error getting page: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
