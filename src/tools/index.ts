import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../utils/types.ts";
import { registerForgeTools } from "./forge.ts";
import { registerCastTools } from "./cast.ts";
import { registerAnvilTools } from "./anvil.ts";
import { registerChiselTools } from "./chisel.ts";
import { registerHelpTools } from "./help.ts";

export function registerAllTools(server: McpServer, context: ToolContext) {
  registerForgeTools(server, context);
  registerCastTools(server, context);
  registerAnvilTools(server, context);
  registerChiselTools(server, context);
  registerHelpTools(server, context);
}
