import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getPage } from '../api/pages.js';
import { htmlToMarkdown } from '../utils/htmlToMarkdown.js';

/**
 * Зарегистрировать ресурс для доступа к содержимому страницы
 * @param server - экземпляр McpServer
 * @param client - экземпляр ConfluenceClient
 */
export function registerPageResource(server: McpServer, client: ConfluenceClient): void {
  server.resource(
    'page',
    'confluence://page/{pageId}',
    {
      title: 'Confluence Page',
      description: 'Содержимое страницы Confluence',
      mimeType: 'text/markdown'
    },
    async (uri, params) => {
      try {
        const paramsRecord = params as Record<string, unknown>;
        const pageId = paramsRecord.pageId as string;
        const page = await getPage(client, pageId, {
          includeBody: true,
          bodyFormat: 'view'
        });

        const pageRecord = page as unknown as Record<string, unknown>;
        const body = pageRecord.body as Record<string, unknown> | undefined;
        const viewBody = body?.view as Record<string, unknown> | undefined;
        const storageBody = body?.storage as Record<string, unknown> | undefined;
        const bodyContent = (viewBody?.value as string) || (storageBody?.value as string) || '';
        const markdown = htmlToMarkdown(bodyContent);

        return {
          contents: [{
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# ${page.title}\n\n${markdown}`
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Error getting page: ${errorMessage}`);
      }
    }
  );
}
