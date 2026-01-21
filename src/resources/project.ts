import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../utils/types.ts";
import { exec } from "../utils/exec.ts";

async function fileExists(path: string): Promise<boolean> {
  try {
    return await Bun.file(path).exists();
  } catch {
    return false;
  }
}

async function readFile(path: string): Promise<string | null> {
  try {
    const file = Bun.file(path);
    if (await file.exists()) {
      return await file.text();
    }
    return null;
  } catch {
    return null;
  }
}

async function listDirectory(path: string): Promise<string[]> {
  try {
    const proc = Bun.spawn(["ls", "-1", path], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function registerProjectResources(server: McpServer, context: ToolContext) {
  const projectPath = context.projectPath || process.cwd();

  // foundry://config - Foundry configuration
  server.registerResource(
    "foundry_config",
    "foundry://config",
    {
      description: "Current Foundry project configuration (foundry.toml)",
      mimeType: "text/plain",
    },
    async () => {
      const configPath = `${projectPath}/foundry.toml`;
      const content = await readFile(configPath);

      if (!content) {
        return {
          contents: [
            {
              uri: "foundry://config",
              text: "No foundry.toml found in project directory",
              mimeType: "text/plain" as const,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: "foundry://config",
            text: content,
            mimeType: "text/plain" as const,
          },
        ],
      };
    }
  );

  // foundry://remappings - Import remappings
  server.registerResource(
    "foundry_remappings",
    "foundry://remappings",
    {
      description: "Current import remappings for the project",
      mimeType: "text/plain",
    },
    async () => {
      const result = await exec("forge", ["remappings"], projectPath);

      return {
        contents: [
          {
            uri: "foundry://remappings",
            text: result.success
              ? result.stdout || "No remappings configured"
              : `Error: ${result.stderr}`,
            mimeType: "text/plain" as const,
          },
        ],
      };
    }
  );

  // foundry://contracts - List of contracts in project
  server.registerResource(
    "foundry_contracts",
    "foundry://contracts",
    {
      description: "List of Solidity contracts in the project",
      mimeType: "application/json",
    },
    async () => {
      const srcPath = `${projectPath}/src`;
      const contracts: string[] = [];

      async function findSolFiles(dir: string) {
        const entries = await listDirectory(dir);
        for (const entry of entries) {
          const fullPath = `${dir}/${entry}`;
          if (entry.endsWith(".sol")) {
            contracts.push(fullPath.replace(projectPath + "/", ""));
          } else if (!entry.includes(".")) {
            // Likely a directory
            await findSolFiles(fullPath);
          }
        }
      }

      if (await fileExists(srcPath)) {
        await findSolFiles(srcPath);
      }

      return {
        contents: [
          {
            uri: "foundry://contracts",
            text: JSON.stringify(contracts, null, 2),
            mimeType: "application/json" as const,
          },
        ],
      };
    }
  );

  // foundry://abi/{contract} - Contract ABI (dynamic resource)
  server.registerResource(
    "contract_abi",
    "foundry://abi/{contract}",
    {
      description: "ABI for a compiled contract",
      mimeType: "application/json",
    },
    async (uri) => {
      // Extract contract name from URI
      const match = uri.href.match(/foundry:\/\/abi\/(.+)/);
      if (!match) {
        return {
          contents: [
            {
              uri: uri.href,
              text: "Invalid URI format",
              mimeType: "text/plain" as const,
            },
          ],
        };
      }

      const contract = match[1]!;
      const result = await exec("forge", ["inspect", contract, "abi"], projectPath);

      return {
        contents: [
          {
            uri: uri.href,
            text: result.success ? result.stdout : `Error: ${result.stderr}`,
            mimeType: "application/json" as const,
          },
        ],
      };
    }
  );

  // foundry://bytecode/{contract} - Contract bytecode
  server.registerResource(
    "contract_bytecode",
    "foundry://bytecode/{contract}",
    {
      description: "Bytecode for a compiled contract",
      mimeType: "text/plain",
    },
    async (uri) => {
      const match = uri.href.match(/foundry:\/\/bytecode\/(.+)/);
      if (!match) {
        return {
          contents: [
            {
              uri: uri.href,
              text: "Invalid URI format",
              mimeType: "text/plain" as const,
            },
          ],
        };
      }

      const contract = match[1]!;
      const result = await exec("forge", ["inspect", contract, "bytecode"], projectPath);

      return {
        contents: [
          {
            uri: uri.href,
            text: result.success ? result.stdout : `Error: ${result.stderr}`,
            mimeType: "text/plain" as const,
          },
        ],
      };
    }
  );

  // foundry://storage-layout/{contract} - Storage layout
  server.registerResource(
    "contract_storage_layout",
    "foundry://storage-layout/{contract}",
    {
      description: "Storage layout for a compiled contract",
      mimeType: "application/json",
    },
    async (uri) => {
      const match = uri.href.match(/foundry:\/\/storage-layout\/(.+)/);
      if (!match) {
        return {
          contents: [
            {
              uri: uri.href,
              text: "Invalid URI format",
              mimeType: "text/plain" as const,
            },
          ],
        };
      }

      const contract = match[1]!;
      const result = await exec("forge", ["inspect", contract, "storageLayout"], projectPath);

      return {
        contents: [
          {
            uri: uri.href,
            text: result.success ? result.stdout : `Error: ${result.stderr}`,
            mimeType: "application/json" as const,
          },
        ],
      };
    }
  );

  // foundry://method-identifiers/{contract} - Method identifiers
  server.registerResource(
    "contract_method_identifiers",
    "foundry://method-identifiers/{contract}",
    {
      description: "Function selectors for a compiled contract",
      mimeType: "application/json",
    },
    async (uri) => {
      const match = uri.href.match(/foundry:\/\/method-identifiers\/(.+)/);
      if (!match) {
        return {
          contents: [
            {
              uri: uri.href,
              text: "Invalid URI format",
              mimeType: "text/plain" as const,
            },
          ],
        };
      }

      const contract = match[1]!;
      const result = await exec("forge", ["inspect", contract, "methodIdentifiers"], projectPath);

      return {
        contents: [
          {
            uri: uri.href,
            text: result.success ? result.stdout : `Error: ${result.stderr}`,
            mimeType: "application/json" as const,
          },
        ],
      };
    }
  );

  // foundry://gas-estimates/{contract} - Gas estimates
  server.registerResource(
    "contract_gas_estimates",
    "foundry://gas-estimates/{contract}",
    {
      description: "Gas estimates for contract functions",
      mimeType: "application/json",
    },
    async (uri) => {
      const match = uri.href.match(/foundry:\/\/gas-estimates\/(.+)/);
      if (!match) {
        return {
          contents: [
            {
              uri: uri.href,
              text: "Invalid URI format",
              mimeType: "text/plain" as const,
            },
          ],
        };
      }

      const contract = match[1]!;
      const result = await exec("forge", ["inspect", contract, "gasEstimates"], projectPath);

      return {
        contents: [
          {
            uri: uri.href,
            text: result.success ? result.stdout : `Error: ${result.stderr}`,
            mimeType: "application/json" as const,
          },
        ],
      };
    }
  );
}
