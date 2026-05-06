import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { getSpace } from '../api/spaces.js';

const ParamsSchema = z.object({
  spaceId: z.string().describe('ID или ключ пространства')
});

/**
 * Зарегистрировать ресурс для доступа к информации о пространстве
 * @param server - экземпляр McpServer
 * @param client - экземпляр ConfluenceClient
 */
export function registerSpaceResource(server: McpServer, client: ConfluenceClient): void {
  server.resource(
    'space',
    'confluence://space/{spaceId}',
    {
      title: 'Confluence Space',
      description: 'Информация о пространстве Confluence',
      mimeType: 'application/json'
    },
    async (uri, params) => {
      try {
        const { spaceId } = ParamsSchema.parse(params);
        const space = await getSpace(client, spaceId);

        const spaceData: Record<string, unknown> = {
          key: space.key,
          name: space.name,
          description: (space as Record<string, unknown>).description,
          homepageId: (space as Record<string, unknown>).homepageId,
          createdAt: space.createdAt,
          webUrl: space._links.webui
        };

        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(spaceData, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Error getting space: ${errorMessage}`);
      }
    }
  );
}
