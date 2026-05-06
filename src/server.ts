import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function createConfluenceServer(config?: { name?: string; version?: string }): McpServer {
  const serverName = config?.name ?? 'confluence-mcp';
  const serverVersion = config?.version ?? '1.0.0';

  const server = new McpServer({
    name: serverName,
    version: serverVersion
  });

  return server;
}
