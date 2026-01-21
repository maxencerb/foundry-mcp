import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../utils/types.ts";
import { registerPromptTemplates } from "./templates.ts";

export function registerAllPrompts(server: McpServer, context: ToolContext) {
  registerPromptTemplates(server, context);
}
