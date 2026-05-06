import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getSpace } from '../api/spaces.js';
import { listPages } from '../api/pages.js';

/**
 * Зарегистрировать промпт для аудита контента пространства Confluence
 * @param server - экземпляр McpServer
 * @param client - экземпляр ConfluenceClient
 */
export function registerContentAuditPrompt(server: McpServer, client: ConfluenceClient): void {
  server.prompt(
    'contentAudit',
    'Промпт для аудита контента пространства Confluence',
    {
      spaceId: z.string().describe('ID пространства для аудита'),
      limit: z.number().default(100).describe('Максимальное количество страниц для анализа')
    },
    async ({ spaceId, limit }) => {
      const space = await getSpace(client, spaceId);
      const pagesResponse = await listPages(client, spaceId, { limit });

      const pageHierarchy = pagesResponse.results.map((page) => ({
        id: page.id,
        title: page.title,
        parentId: page.parentId ?? null,
        position: page.position
      }));

      const prompt = `Audit the content structure of Confluence space "${space.name}" (${space.key}).

Space Statistics:
- Total Pages: ${pagesResponse.results.length}
- Homepage ID: ${space.id}

Page Hierarchy:
${JSON.stringify(pageHierarchy, null, 2)}

Tasks:
1. Identify orphaned pages (no parent, not homepage)
2. Find deeply nested pages (>5 levels)
3. Suggest content reorganization
4. Identify outdated pages (not updated in 6+ months)

Please analyze the page structure and provide recommendations for improving the content organization.`;

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
