import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getPage } from '../api/pages.js';

/**
 * Зарегистрировать промпт для ревью страницы Confluence
 * @param server - экземпляр McpServer
 * @param client - экземпляр ConfluenceClient
 */
export function registerPageReviewPrompt(server: McpServer, client: ConfluenceClient): void {
  server.prompt(
    'pageReview',
    'Промпт для ревью содержимого страницы Confluence',
    {
      pageId: z.string().describe('ID страницы для ревью')
    },
    async ({ pageId }) => {
      const page = await getPage(client, pageId, { includeBody: true, bodyFormat: 'view' });

      const bodyContent = 'body' in page && page.body?.view?.value 
        ? page.body.view.value 
        : 'No content available';

      const prompt = `Please review the following Confluence page and provide feedback on:
1. Clarity and structure
2. Technical accuracy
3. Missing information
4. Suggestions for improvement

Page: ${page.title}
Space ID: ${page.spaceId}
Last Updated: ${page.version.createdAt} (version ${page.version.number})

---

${bodyContent}

Please provide detailed feedback on each of the four areas above.`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: prompt
            }
          }
        ]
      };
    }
  );
}
