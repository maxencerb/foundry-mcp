import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec, buildArgs, formatOutput, textContent } from "../utils/exec.ts";
import type { ToolContext } from "../utils/types.ts";
import { rpcUrlSchema } from "../utils/validation.ts";

export function registerChiselTools(server: McpServer, context: ToolContext) {
  // chisel eval - Evaluate a Solidity expression
  server.registerTool(
    "chisel_eval",
    {
      description: "Evaluate a Solidity expression and return the result",
      inputSchema: {
        code: z.string().describe("Solidity expression to evaluate"),
        "fork-url": rpcUrlSchema.describe("Fork URL for network access"),
      },
    },
    async ({ code, "fork-url": forkUrl }) => {
      const args: string[] = [];
      if (forkUrl || context.rpcUrl) {
        args.push("--fork-url", forkUrl || context.rpcUrl!);
      }

      // Use echo to pipe the expression to chisel
      const fullCmd = `echo '${code.replace(/'/g, "'\\''")}' | chisel ${args.join(" ")}`;
      const proc = Bun.spawn(["bash", "-c", fullCmd], {
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
      });

      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);

      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        return textContent(`Error: ${stderr || stdout}`);
      }

      // Parse chisel output to extract the result
      const lines = stdout.split("\n").filter((l) => l.trim());
      const resultLine = lines.find((l) => l.includes("Type:") || l.includes("├") || l.includes("└"));

      return textContent(resultLine || stdout.trim() || "Expression evaluated (no output)");
    }
  );

  // chisel run - Run Solidity statements
  server.registerTool(
    "chisel_run",
    {
      description: "Run multiple Solidity statements in sequence",
      inputSchema: {
        code: z.string().describe("Solidity code to run (can be multiple statements)"),
        "fork-url": rpcUrlSchema.describe("Fork URL for network access"),
      },
    },
    async ({ code, "fork-url": forkUrl }) => {
      const args: string[] = [];
      if (forkUrl || context.rpcUrl) {
        args.push("--fork-url", forkUrl || context.rpcUrl!);
      }

      // Create a temporary file with the commands
      const tmpFile = `/tmp/chisel_${Date.now()}.sol`;
      await Bun.write(tmpFile, code);

      try {
        const fullCmd = `cat ${tmpFile} | chisel ${args.join(" ")}`;
        const proc = Bun.spawn(["bash", "-c", fullCmd], {
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            NO_COLOR: "1",
          },
        });

        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);

        const exitCode = await proc.exited;

        if (exitCode !== 0 && stderr) {
          return textContent(`Error: ${stderr}`);
        }

        return textContent(stdout.trim() || "Code executed successfully");
      } finally {
        // Clean up temp file
        try {
          await Bun.file(tmpFile).exists() && (await Bun.write(tmpFile, ""));
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  );

  // chisel list - List saved sessions
  server.registerTool(
    "chisel_list",
    {
      description: "List all saved Chisel sessions",
      inputSchema: {},
    },
    async () => {
      const result = await exec("chisel", ["list"]);
      return textContent(formatOutput(result));
    }
  );

  // chisel load - Load a saved session
  server.registerTool(
    "chisel_load",
    {
      description: "Load a previously saved Chisel session",
      inputSchema: {
        id: z.string().describe("Session ID to load"),
      },
    },
    async ({ id }) => {
      const result = await exec("chisel", ["load", id]);
      return textContent(formatOutput(result));
    }
  );

  // chisel view - View a saved session
  server.registerTool(
    "chisel_view",
    {
      description: "View the source of a saved Chisel session",
      inputSchema: {
        id: z.string().describe("Session ID to view"),
      },
    },
    async ({ id }) => {
      const result = await exec("chisel", ["view", id]);
      return textContent(formatOutput(result));
    }
  );

  // chisel clear-cache - Clear the Chisel cache
  server.registerTool(
    "chisel_clear_cache",
    {
      description: "Clear the Chisel cache",
      inputSchema: {},
    },
    async () => {
      const result = await exec("chisel", ["clear-cache"]);
      return textContent(formatOutput(result));
    }
  );
}
