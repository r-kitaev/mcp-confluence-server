import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { registerSpaceResource } from './spaceResource.js';
import { registerPageResource } from './pageResource.js';
import { registerPageAttachmentsResource } from './pageAttachmentsResource.js';

/**
 * Зарегистрировать все MCP ресурсы
 * @param server - экземпляр McpServer
 * @param client - экземпляр ConfluenceClient
 */
export function registerAllResources(server: McpServer, client: ConfluenceClient): void {
  registerSpaceResource(server, client);
  registerPageResource(server, client);
  registerPageAttachmentsResource(server, client);
}
