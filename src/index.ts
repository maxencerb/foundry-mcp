#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.ts";
import { registerAllResources } from "./resources/index.ts";
import { registerAllPrompts } from "./prompts/index.ts";
import { getEnvContext } from "./utils/types.ts";

// Create the MCP server
const server = new McpServer({
  name: "foundry-mcp",
  version: "1.0.0",
  description: "MCP server for the Foundry Ethereum development toolkit (Forge, Cast, Anvil, Chisel)",
});

// Get context from environment
const context = getEnvContext();

// Register all tools, resources, and prompts
registerAllTools(server, context);
registerAllResources(server, context);
registerAllPrompts(server, context);

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup info to stderr (so it doesn't interfere with stdio transport)
  console.error("Foundry MCP Server started");
  console.error(`Project path: ${context.projectPath}`);
  if (context.rpcUrl) {
    console.error(`RPC URL: ${context.rpcUrl}`);
  }
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
