import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConfluenceClient } from '../api/client.js';
import { registerGetSpaceTool } from './getSpace.js';
import { registerListSpacesTool } from './listSpaces.js';
import { registerGetPageTool } from './getPage.js';
import { registerListPagesTool } from './listPages.js';
import { registerCreatePageTool } from './createPage.js';
import { registerUpdatePageTool } from './updatePage.js';
import { registerDeletePageTool } from './deletePage.js';
import { registerGetAttachmentsTool } from './getAttachments.js';

export function registerAllTools(server: McpServer, client: ConfluenceClient): void {
  registerGetSpaceTool(server, client);
  registerListSpacesTool(server, client);
  registerGetPageTool(server, client);
  registerListPagesTool(server, client);
  registerCreatePageTool(server, client);
  registerUpdatePageTool(server, client);
  registerDeletePageTool(server, client);
  registerGetAttachmentsTool(server, client);
}
