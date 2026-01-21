import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface AnvilInstance {
  port: number;
  pid: number;
  forkUrl?: string;
}

export interface ToolContext {
  rpcUrl?: string;
  privateKey?: string;
  projectPath?: string;
}

export type ToolHandler<T> = (
  args: T,
  context: ToolContext
) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export type RegisterToolsFn = (server: McpServer, context: ToolContext) => void;

export function getEnvContext(): ToolContext {
  return {
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    projectPath: process.env.FOUNDRY_PROJECT || process.cwd(),
  };
}
