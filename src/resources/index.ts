import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../utils/types.ts";
import { registerProjectResources } from "./project.ts";
import { registerDocsResources } from "./docs.ts";

export function registerAllResources(server: McpServer, context: ToolContext) {
  registerProjectResources(server, context);
  registerDocsResources(server, context);
}
