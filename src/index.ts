import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createConfluenceServer } from './server.js';

async function main(): Promise<void> {
  try {
    const server: McpServer = createConfluenceServer({
      name: 'confluence-mcp',
      version: '1.0.0'
    });

    const transport = new StdioServerTransport();

    await server.connect(transport);

    process.on('SIGINT', async () => {
      console.error('Shutting down MCP server...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();
