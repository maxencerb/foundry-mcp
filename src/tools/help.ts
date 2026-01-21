import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec, formatOutput, textContent } from "../utils/exec.ts";
import type { ToolContext } from "../utils/types.ts";

export function registerHelpTools(server: McpServer, _context: ToolContext) {
  // forge --help
  server.registerTool(
    "forge_help",
    {
      description: `Get help for forge commands. Supports nested subcommands.
Examples:
- No subcommand: shows all forge commands
- "test": shows forge test options
- "test --gas-report": shows help for specific flags
- "script": shows forge script options
- "inspect": shows forge inspect options`,
      inputSchema: {
        subcommand: z
          .string()
          .optional()
          .describe("Subcommand(s) to get help for (e.g., 'test', 'script', 'build', 'create')"),
      },
    },
    async ({ subcommand }) => {
      const args = subcommand ? [...subcommand.split(" "), "--help"] : ["--help"];
      const result = await exec("forge", args);
      return textContent(formatOutput(result));
    }
  );

  // cast --help
  server.registerTool(
    "cast_help",
    {
      description: `Get help for cast commands. Supports nested subcommands.
Examples:
- No subcommand: shows all cast commands
- "call": shows cast call options
- "send": shows cast send options
- "wallet": shows cast wallet subcommands
- "wallet sign": shows cast wallet sign options
- "abi-encode": shows cast abi-encode options`,
      inputSchema: {
        subcommand: z
          .string()
          .optional()
          .describe("Subcommand(s) to get help for (e.g., 'call', 'send', 'wallet sign', 'abi-encode')"),
      },
    },
    async ({ subcommand }) => {
      const args = subcommand ? [...subcommand.split(" "), "--help"] : ["--help"];
      const result = await exec("cast", args);
      return textContent(formatOutput(result));
    }
  );

  // anvil --help
  server.registerTool(
    "anvil_help",
    {
      description: `Get help for anvil. Shows all available options for the local Ethereum node.
Anvil doesn't have subcommands, so this shows the full help with all flags.`,
      inputSchema: {},
    },
    async () => {
      const result = await exec("anvil", ["--help"]);
      return textContent(formatOutput(result));
    }
  );

  // chisel --help
  server.registerTool(
    "chisel_help",
    {
      description: `Get help for chisel commands. Supports subcommands.
Examples:
- No subcommand: shows all chisel commands
- "list": shows chisel list options
- "load": shows chisel load options
- "view": shows chisel view options`,
      inputSchema: {
        subcommand: z
          .string()
          .optional()
          .describe("Subcommand to get help for (e.g., 'list', 'load', 'view', 'clear-cache')"),
      },
    },
    async ({ subcommand }) => {
      const args = subcommand ? [...subcommand.split(" "), "--help"] : ["--help"];
      const result = await exec("chisel", args);
      return textContent(formatOutput(result));
    }
  );

  // Get Foundry version
  server.registerTool(
    "foundry_version",
    {
      description: "Get the installed Foundry version for all tools (forge, cast, anvil, chisel)",
      inputSchema: {},
    },
    async () => {
      const results = await Promise.all([
        exec("forge", ["--version"]),
        exec("cast", ["--version"]),
        exec("anvil", ["--version"]),
        exec("chisel", ["--version"]),
      ]);

      const versions = [
        `Forge: ${results[0]?.stdout || "not installed"}`,
        `Cast: ${results[1]?.stdout || "not installed"}`,
        `Anvil: ${results[2]?.stdout || "not installed"}`,
        `Chisel: ${results[3]?.stdout || "not installed"}`,
      ];

      return textContent(versions.join("\n"));
    }
  );

  // List all available subcommands for a tool
  server.registerTool(
    "foundry_list_commands",
    {
      description: "List all available commands/subcommands for a Foundry tool. Useful to discover what commands are available.",
      inputSchema: {
        tool: z.enum(["forge", "cast", "chisel"]).describe("The tool to list commands for"),
      },
    },
    async ({ tool }) => {
      const result = await exec(tool, ["--help"]);

      if (!result.success) {
        return textContent(`Error: ${result.stderr}`);
      }

      // Parse the help output to extract commands
      const lines = result.stdout.split("\n");
      const commands: string[] = [];
      let inCommandsSection = false;

      for (const line of lines) {
        if (line.includes("Commands:") || line.includes("Subcommands:")) {
          inCommandsSection = true;
          continue;
        }
        if (inCommandsSection) {
          if (line.trim() === "" || line.startsWith("Options:")) {
            inCommandsSection = false;
            continue;
          }
          const match = line.match(/^\s+(\S+)/);
          if (match) {
            commands.push(match[1]!);
          }
        }
      }

      return textContent(
        `Available ${tool} commands:\n${commands.map((c) => `  - ${c}`).join("\n")}\n\nUse ${tool}_help with a subcommand to get detailed help.`
      );
    }
  );
}
