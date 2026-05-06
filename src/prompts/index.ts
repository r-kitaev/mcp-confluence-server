import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { registerPageReviewPrompt } from './pageReview.js';
import { registerContentAuditPrompt } from './contentAudit.js';

/**
 * Зарегистрировать все MCP промпты
 * @param server - экземпляр McpServer
 * @param client - экземпляр ConfluenceClient
 */
export function registerAllPrompts(server: McpServer, client: ConfluenceClient): void {
  registerPageReviewPrompt(server, client);
  registerContentAuditPrompt(server, client);
}
