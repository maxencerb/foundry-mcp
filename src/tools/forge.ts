import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec, buildArgs, formatOutput, textContent } from "../utils/exec.ts";
import type { ToolContext } from "../utils/types.ts";
import {
  contractNameSchema,
  filePathSchema,
  rpcUrlSchema,
  privateKeySchema,
  verbositySchema,
  chainSchema,
} from "../utils/validation.ts";

export function registerForgeTools(server: McpServer, context: ToolContext) {
  // forge init - Initialize new Foundry project
  server.registerTool(
    "forge_init",
    {
      description: "Initialize a new Foundry project",
      inputSchema: {
        name: z.string().describe("Project name/directory"),
        template: z.string().optional().describe("Template to use (GitHub repo URL)"),
        vscode: z.boolean().optional().describe("Create VSCode settings directory"),
        force: z.boolean().optional().describe("Force initialization in non-empty directory"),
      },
    },
    async ({ name, template, vscode, force }) => {
      const args = buildArgs({ template, vscode, force });
      args.push(name);
      const result = await exec("forge", ["init", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge build - Compile contracts
  server.registerTool(
    "forge_build",
    {
      description: "Compile Solidity contracts",
      inputSchema: {
        optimize: z.boolean().optional().describe("Enable optimizer"),
        "optimizer-runs": z.number().int().positive().optional().describe("Optimizer runs"),
        "via-ir": z.boolean().optional().describe("Use IR-based code generator"),
        force: z.boolean().optional().describe("Force recompilation"),
        sizes: z.boolean().optional().describe("Show contract sizes"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["build", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge test - Run tests
  server.registerTool(
    "forge_test",
    {
      description: "Run Solidity tests",
      inputSchema: {
        "match-test": z.string().optional().describe("Test name pattern to match"),
        "match-contract": z.string().optional().describe("Contract name pattern to match"),
        "match-path": z.string().optional().describe("File path pattern to match"),
        "fork-url": rpcUrlSchema.describe("Fork from this RPC URL"),
        "fork-block-number": z.number().int().positive().optional().describe("Fork at specific block number"),
        v: verbositySchema.describe("Verbosity level (0-5)"),
        gas_report: z.boolean().optional().describe("Show gas report"),
        fuzz_runs: z.number().int().positive().optional().describe("Number of fuzz runs"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["test", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge coverage - Generate coverage report
  server.registerTool(
    "forge_coverage",
    {
      description: "Generate test coverage report",
      inputSchema: {
        report: z.enum(["summary", "lcov", "debug", "bytecode"]).optional().describe("Report type"),
        "ir-minimum": z.boolean().optional().describe("Use IR minimum optimization"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["coverage", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge script - Execute Solidity script
  server.registerTool(
    "forge_script",
    {
      description: "Execute a Solidity deployment/automation script",
      inputSchema: {
        script: filePathSchema.describe("Path to script file (e.g., script/Deploy.s.sol)"),
        sig: z.string().optional().describe("Function signature to call (default: run())"),
        "rpc-url": rpcUrlSchema.describe("RPC URL for deployment"),
        broadcast: z.boolean().optional().describe("Actually broadcast transactions"),
        verify: z.boolean().optional().describe("Verify contracts after deployment"),
        resume: z.boolean().optional().describe("Resume failed deployment"),
        slow: z.boolean().optional().describe("Wait for each transaction receipt"),
        "private-key": privateKeySchema.describe("Private key for signing"),
        v: verbositySchema.describe("Verbosity level"),
      },
    },
    async ({ script, ...options }) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["script", script, ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge create - Deploy a single contract
  server.registerTool(
    "forge_create",
    {
      description: "Deploy a single contract",
      inputSchema: {
        contract: contractNameSchema.describe("Contract to deploy (e.g., src/Counter.sol:Counter)"),
        "constructor-args": z.array(z.string()).optional().describe("Constructor arguments"),
        "rpc-url": rpcUrlSchema.describe("RPC URL for deployment"),
        "private-key": privateKeySchema.describe("Private key for signing"),
        verify: z.boolean().optional().describe("Verify contract after deployment"),
        "etherscan-api-key": z.string().optional().describe("Etherscan API key for verification"),
        legacy: z.boolean().optional().describe("Use legacy transaction type"),
      },
    },
    async ({ contract, "constructor-args": constructorArgs, ...options }) => {
      const args = buildArgs(options);
      if (constructorArgs && constructorArgs.length > 0) {
        args.push("--constructor-args", ...constructorArgs);
      }
      const result = await exec("forge", ["create", contract, ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge verify-contract - Verify contract on block explorer
  server.registerTool(
    "forge_verify",
    {
      description: "Verify a deployed contract on block explorer",
      inputSchema: {
        address: z.string().describe("Deployed contract address"),
        contract: contractNameSchema.describe("Contract name"),
        chain: chainSchema.describe("Chain name or ID"),
        "etherscan-api-key": z.string().optional().describe("Etherscan API key"),
        "constructor-args": z.string().optional().describe("ABI-encoded constructor arguments"),
        watch: z.boolean().optional().describe("Poll for verification status"),
      },
    },
    async ({ address, contract, ...options }) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["verify-contract", address, contract, ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge flatten - Flatten contract sources
  server.registerTool(
    "forge_flatten",
    {
      description: "Flatten contract into single file",
      inputSchema: {
        contract: filePathSchema.describe("Contract file to flatten"),
        output: z.string().optional().describe("Output file path"),
      },
    },
    async ({ contract, output }) => {
      const args = output ? ["-o", output] : [];
      const result = await exec("forge", ["flatten", contract, ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge inspect - Inspect contract metadata
  server.registerTool(
    "forge_inspect",
    {
      description: "Inspect compiled contract for ABI, bytecode, storage layout, etc.",
      inputSchema: {
        contract: contractNameSchema.describe("Contract name to inspect"),
        field: z.enum([
          "abi", "bytecode", "deployedBytecode", "assembly", "assemblyOptimized",
          "methodIdentifiers", "gasEstimates", "storageLayout", "devdoc", "userdoc",
          "metadata", "ir", "irOptimized", "ewasm", "errors", "events",
        ]).describe("Field to inspect"),
        pretty: z.boolean().optional().describe("Pretty print JSON output"),
      },
    },
    async ({ contract, field, pretty }) => {
      const args = pretty ? ["--pretty"] : [];
      const result = await exec("forge", ["inspect", contract, field, ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge remappings - Show remappings
  server.registerTool(
    "forge_remappings",
    {
      description: "Show current import remappings",
      inputSchema: {},
    },
    async () => {
      const result = await exec("forge", ["remappings"], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge tree - Show dependency tree
  server.registerTool(
    "forge_tree",
    {
      description: "Show project dependency tree",
      inputSchema: {
        "no-dedupe": z.boolean().optional().describe("Don't dedupe dependencies"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["tree", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge clean - Clean build artifacts
  server.registerTool(
    "forge_clean",
    {
      description: "Remove build artifacts",
      inputSchema: {},
    },
    async () => {
      const result = await exec("forge", ["clean"], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge install - Install dependency
  server.registerTool(
    "forge_install",
    {
      description: "Install a dependency from GitHub",
      inputSchema: {
        dependency: z.string().describe("Dependency to install (e.g., openzeppelin/openzeppelin-contracts)"),
        "no-commit": z.boolean().optional().describe("Skip git commit"),
        "no-git": z.boolean().optional().describe("Skip git operations entirely"),
      },
    },
    async ({ dependency, ...options }) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["install", dependency, ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge update - Update dependencies
  server.registerTool(
    "forge_update",
    {
      description: "Update project dependencies",
      inputSchema: {
        dependency: z.string().optional().describe("Specific dependency to update"),
      },
    },
    async ({ dependency }) => {
      const args = dependency ? [dependency] : [];
      const result = await exec("forge", ["update", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge fmt - Format Solidity code
  server.registerTool(
    "forge_fmt",
    {
      description: "Format Solidity source files",
      inputSchema: {
        check: z.boolean().optional().describe("Check if files are formatted"),
        raw: z.boolean().optional().describe("Print raw formatted output"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["fmt", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge snapshot - Generate gas snapshots
  server.registerTool(
    "forge_snapshot",
    {
      description: "Generate gas snapshots for tests",
      inputSchema: {
        diff: z.string().optional().describe("Compare against snapshot file"),
        check: z.string().optional().describe("Check against snapshot file"),
        "match-test": z.string().optional().describe("Test pattern to match"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["snapshot", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge doc - Generate documentation
  server.registerTool(
    "forge_doc",
    {
      description: "Generate documentation for Solidity contracts",
      inputSchema: {
        build: z.boolean().optional().describe("Build documentation"),
        serve: z.boolean().optional().describe("Serve documentation locally"),
        out: z.string().optional().describe("Output directory"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["doc", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge selectors - List function selectors
  server.registerTool(
    "forge_selectors",
    {
      description: "List all function selectors in the project",
      inputSchema: {
        contract: z.string().optional().describe("Specific contract to list"),
      },
    },
    async ({ contract }) => {
      const args = contract ? [contract] : [];
      const result = await exec("forge", ["selectors", "list", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );

  // forge bind - Generate Rust bindings
  server.registerTool(
    "forge_bind",
    {
      description: "Generate Rust bindings for contracts",
      inputSchema: {
        "bindings-path": z.string().optional().describe("Output path for bindings"),
        crate_name: z.string().optional().describe("Name for generated crate"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("forge", ["bind", ...args], context.projectPath);
      return textContent(formatOutput(result));
    }
  );
}
