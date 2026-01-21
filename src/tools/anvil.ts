import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec, buildArgs, formatOutput, textContent } from "../utils/exec.ts";
import type { ToolContext, AnvilInstance } from "../utils/types.ts";
import { addressSchema, rpcUrlSchema } from "../utils/validation.ts";

// Track running Anvil instances
const anvilInstances: Map<number, AnvilInstance> = new Map();

function getRpcUrl(
  rpcUrl: string | undefined,
  context: ToolContext,
  port?: number
): string {
  if (rpcUrl) return rpcUrl;
  if (port) return `http://127.0.0.1:${port}`;
  return context.rpcUrl || "http://127.0.0.1:8545";
}

async function jsonRpcCall(
  rpcUrl: string,
  method: string,
  params: unknown[] = []
): Promise<unknown> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const data = (await response.json()) as { result?: unknown; error?: { message: string } };

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result;
}

export function registerAnvilTools(server: McpServer, context: ToolContext) {
  // anvil_start - Start local Anvil node
  server.registerTool(
    "anvil_start",
    {
      description: "Start a local Anvil Ethereum development node",
      inputSchema: {
        port: z.number().int().positive().optional().describe("Port to listen on (default: 8545)"),
        "fork-url": rpcUrlSchema.describe("URL to fork from"),
        "fork-block-number": z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Block number to fork at"),
        accounts: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Number of dev accounts (default: 10)"),
        balance: z
          .number()
          .positive()
          .optional()
          .describe("ETH balance for dev accounts (default: 10000)"),
        "block-time": z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Block time in seconds (default: auto-mine)"),
        "chain-id": z.number().int().positive().optional().describe("Chain ID"),
        "gas-limit": z.number().int().positive().optional().describe("Block gas limit"),
        "gas-price": z.number().int().nonnegative().optional().describe("Gas price in wei"),
        mnemonic: z.string().optional().describe("BIP39 mnemonic for accounts"),
        "no-mining": z.boolean().optional().describe("Disable auto-mining"),
        silent: z.boolean().optional().describe("Don't print startup info"),
      },
    },
    async ({ port = 8545, ...options }) => {
      // Check if already running on this port
      if (anvilInstances.has(port)) {
        return textContent(`Anvil is already running on port ${port}`);
      }

      const args = buildArgs({ port, ...options });

      // Start anvil in background
      const proc = Bun.spawn(["anvil", ...args], {
        stdout: "pipe",
        stderr: "pipe",
      });

      // Wait a bit for startup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if it's running
      try {
        const result = await jsonRpcCall(
          `http://127.0.0.1:${port}`,
          "eth_chainId"
        );

        anvilInstances.set(port, {
          port,
          pid: proc.pid,
          forkUrl: options["fork-url"],
        });

        return textContent(
          `Anvil started successfully on port ${port}\nPID: ${proc.pid}\nChain ID: ${result}`
        );
      } catch {
        proc.kill();
        return textContent(
          `Failed to start Anvil on port ${port}. Check if the port is available.`
        );
      }
    }
  );

  // anvil_stop - Stop Anvil node
  server.registerTool(
    "anvil_stop",
    {
      description: "Stop a running Anvil node",
      inputSchema: {
        port: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Port of Anvil instance (default: 8545)"),
      },
    },
    async ({ port = 8545 }) => {
      const instance = anvilInstances.get(port);
      if (!instance) {
        return textContent(`No Anvil instance tracked on port ${port}`);
      }

      try {
        process.kill(instance.pid, "SIGTERM");
        anvilInstances.delete(port);
        return textContent(`Anvil stopped on port ${port}`);
      } catch (error) {
        anvilInstances.delete(port);
        return textContent(
          `Error stopping Anvil: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_status - Check Anvil status
  server.registerTool(
    "anvil_status",
    {
      description: "Check status of Anvil node(s)",
      inputSchema: {
        port: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Port to check (default: check all tracked)"),
      },
    },
    async ({ port }) => {
      if (port) {
        const instance = anvilInstances.get(port);
        if (!instance) {
          // Try to check if something is running anyway
          try {
            const chainId = await jsonRpcCall(
              `http://127.0.0.1:${port}`,
              "eth_chainId"
            );
            return textContent(
              `Anvil running on port ${port} (untracked)\nChain ID: ${chainId}`
            );
          } catch {
            return textContent(`No Anvil instance running on port ${port}`);
          }
        }

        try {
          const chainId = await jsonRpcCall(
            `http://127.0.0.1:${port}`,
            "eth_chainId"
          );
          return textContent(
            `Anvil running on port ${port}\nPID: ${instance.pid}\nChain ID: ${chainId}\nFork URL: ${instance.forkUrl || "none"}`
          );
        } catch {
          anvilInstances.delete(port);
          return textContent(`Anvil on port ${port} is not responding (removed from tracking)`);
        }
      }

      // Check all tracked instances
      if (anvilInstances.size === 0) {
        return textContent("No tracked Anvil instances");
      }

      const statuses: string[] = [];
      for (const [p, instance] of anvilInstances) {
        try {
          const chainId = await jsonRpcCall(
            `http://127.0.0.1:${p}`,
            "eth_chainId"
          );
          statuses.push(
            `Port ${p}: Running (PID: ${instance.pid}, Chain ID: ${chainId})`
          );
        } catch {
          anvilInstances.delete(p);
          statuses.push(`Port ${p}: Not responding (removed)`);
        }
      }

      return textContent(statuses.join("\n"));
    }
  );

  // anvil_mine - Mine blocks
  server.registerTool(
    "anvil_mine",
    {
      description: "Mine one or more blocks",
      inputSchema: {
        blocks: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Number of blocks to mine (default: 1)"),
        interval: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Interval between blocks in seconds"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ blocks = 1, interval, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        if (interval) {
          await jsonRpcCall(url, "anvil_mine", [
            `0x${blocks.toString(16)}`,
            `0x${interval.toString(16)}`,
          ]);
        } else {
          await jsonRpcCall(url, "anvil_mine", [`0x${blocks.toString(16)}`]);
        }
        return textContent(`Mined ${blocks} block(s)`);
      } catch (error) {
        return textContent(
          `Error mining blocks: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_set_balance - Set account balance
  server.registerTool(
    "anvil_setBalance",
    {
      description: "Set the ETH balance of an address",
      inputSchema: {
        address: addressSchema.describe("Address to modify"),
        balance: z.string().describe("New balance in wei (hex or decimal)"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, balance, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        // Convert to hex if decimal
        const hexBalance = balance.startsWith("0x")
          ? balance
          : `0x${BigInt(balance).toString(16)}`;
        await jsonRpcCall(url, "anvil_setBalance", [address, hexBalance]);
        return textContent(`Set balance of ${address} to ${balance} wei`);
      } catch (error) {
        return textContent(
          `Error setting balance: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_set_code - Set contract code
  server.registerTool(
    "anvil_setCode",
    {
      description: "Set the bytecode at an address",
      inputSchema: {
        address: addressSchema.describe("Address to modify"),
        code: z.string().describe("Bytecode to set"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, code, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        await jsonRpcCall(url, "anvil_setCode", [address, code]);
        return textContent(`Set code at ${address}`);
      } catch (error) {
        return textContent(
          `Error setting code: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_set_storage_at - Set storage slot
  server.registerTool(
    "anvil_setStorageAt",
    {
      description: "Set a storage slot value",
      inputSchema: {
        address: addressSchema.describe("Contract address"),
        slot: z.string().describe("Storage slot"),
        value: z.string().describe("Value to set"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, slot, value, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        await jsonRpcCall(url, "anvil_setStorageAt", [address, slot, value]);
        return textContent(`Set storage at ${address}[${slot}] = ${value}`);
      } catch (error) {
        return textContent(
          `Error setting storage: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_impersonate_account - Impersonate account
  server.registerTool(
    "anvil_impersonateAccount",
    {
      description: "Impersonate an account (allow transactions from it without private key)",
      inputSchema: {
        address: addressSchema.describe("Address to impersonate"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        await jsonRpcCall(url, "anvil_impersonateAccount", [address]);
        return textContent(`Now impersonating ${address}`);
      } catch (error) {
        return textContent(
          `Error impersonating: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_stop_impersonating_account - Stop impersonating
  server.registerTool(
    "anvil_stopImpersonatingAccount",
    {
      description: "Stop impersonating an account",
      inputSchema: {
        address: addressSchema.describe("Address to stop impersonating"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        await jsonRpcCall(url, "anvil_stopImpersonatingAccount", [address]);
        return textContent(`Stopped impersonating ${address}`);
      } catch (error) {
        return textContent(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_snapshot - Create state snapshot
  server.registerTool(
    "anvil_snapshot",
    {
      description: "Create a snapshot of the current blockchain state",
      inputSchema: {
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        const snapshotId = await jsonRpcCall(url, "evm_snapshot", []);
        return textContent(`Snapshot created with ID: ${snapshotId}`);
      } catch (error) {
        return textContent(
          `Error creating snapshot: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_revert - Revert to snapshot
  server.registerTool(
    "anvil_revert",
    {
      description: "Revert to a previous snapshot",
      inputSchema: {
        "snapshot-id": z.string().describe("Snapshot ID to revert to"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ "snapshot-id": snapshotId, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        const success = await jsonRpcCall(url, "evm_revert", [snapshotId]);
        return textContent(
          success ? `Reverted to snapshot ${snapshotId}` : "Failed to revert"
        );
      } catch (error) {
        return textContent(
          `Error reverting: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_set_next_block_timestamp - Set next block timestamp
  server.registerTool(
    "anvil_setNextBlockTimestamp",
    {
      description: "Set the timestamp for the next block",
      inputSchema: {
        timestamp: z.number().int().positive().describe("Unix timestamp"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ timestamp, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        await jsonRpcCall(url, "evm_setNextBlockTimestamp", [timestamp]);
        return textContent(`Next block timestamp set to ${timestamp}`);
      } catch (error) {
        return textContent(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_increase_time - Increase time
  server.registerTool(
    "anvil_increaseTime",
    {
      description: "Increase the current block timestamp by seconds",
      inputSchema: {
        seconds: z.number().int().positive().describe("Seconds to increase"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ seconds, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        await jsonRpcCall(url, "evm_increaseTime", [seconds]);
        return textContent(`Time increased by ${seconds} seconds`);
      } catch (error) {
        return textContent(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_set_automine - Set auto-mine mode
  server.registerTool(
    "anvil_setAutomine",
    {
      description: "Enable or disable auto-mining",
      inputSchema: {
        enabled: z.boolean().describe("Enable auto-mining"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ enabled, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        await jsonRpcCall(url, "evm_setAutomine", [enabled]);
        return textContent(`Auto-mining ${enabled ? "enabled" : "disabled"}`);
      } catch (error) {
        return textContent(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_reset - Reset the fork
  server.registerTool(
    "anvil_reset",
    {
      description: "Reset the fork to a different state",
      inputSchema: {
        "fork-url": rpcUrlSchema.describe("New fork URL"),
        "fork-block-number": z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Block number to fork at"),
        "rpc-url": rpcUrlSchema.describe("RPC URL of Anvil instance"),
      },
    },
    async ({ "fork-url": forkUrl, "fork-block-number": blockNumber, "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        const params: { forking?: { jsonRpcUrl: string; blockNumber?: number } } = {};
        if (forkUrl) {
          params.forking = { jsonRpcUrl: forkUrl };
          if (blockNumber) {
            params.forking.blockNumber = blockNumber;
          }
        }
        await jsonRpcCall(url, "anvil_reset", [params]);
        return textContent(
          forkUrl
            ? `Reset fork to ${forkUrl}${blockNumber ? ` at block ${blockNumber}` : ""}`
            : "Reset to empty state"
        );
      } catch (error) {
        return textContent(
          `Error resetting: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // anvil_get_accounts - Get dev accounts
  server.registerTool(
    "anvil_getAccounts",
    {
      description: "Get list of available dev accounts",
      inputSchema: {
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ "rpc-url": rpcUrl }) => {
      const url = getRpcUrl(rpcUrl, context);
      try {
        const accounts = (await jsonRpcCall(url, "eth_accounts", [])) as string[];
        return textContent(`Accounts:\n${accounts.join("\n")}`);
      } catch (error) {
        return textContent(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}
