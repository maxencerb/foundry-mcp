import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../utils/types.ts";

export function registerPromptTemplates(server: McpServer, _context: ToolContext) {
  // Deploy contract prompt
  server.registerPrompt(
    "deploy_contract",
    {
      description: "Guide for deploying a Solidity contract",
      argsSchema: {
        contract_name: z.string().describe("Name of the contract to deploy"),
        network: z.string().optional().describe("Target network (e.g., mainnet, sepolia, local)"),
      },
    },
    ({ contract_name, network }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me deploy the ${contract_name} contract${network ? ` to ${network}` : ""}.

Please:
1. First, compile the contract using forge build
2. Check if there are any compilation errors
3. If deploying to a live network, remind me about:
   - Setting up the RPC URL
   - Having enough ETH for gas
   - Keeping my private key secure
4. Generate the deployment command using forge create or forge script
5. If verification is needed, include the verification step

Contract: ${contract_name}
${network ? `Network: ${network}` : "Network: Not specified (will use local Anvil if available)"}`,
          },
        },
      ],
    })
  );

  // Debug failing test prompt
  server.registerPrompt(
    "debug_test",
    {
      description: "Help debug a failing Solidity test",
      argsSchema: {
        test_name: z.string().describe("Name of the failing test"),
        error_message: z.string().optional().describe("Error message if available"),
      },
    },
    ({ test_name, error_message }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me debug the failing test: ${test_name}

${error_message ? `Error message: ${error_message}` : ""}

Please:
1. Run the test with high verbosity (forge test -vvvv --match-test ${test_name})
2. Analyze the stack trace and identify the failing assertion
3. Check the test setup and any mock contracts
4. Suggest potential fixes
5. If needed, use cast run to replay any transactions

Test: ${test_name}`,
          },
        },
      ],
    })
  );

  // Write test prompt
  server.registerPrompt(
    "write_test",
    {
      description: "Generate tests for a Solidity contract",
      argsSchema: {
        contract_name: z.string().describe("Name of the contract to test"),
        functions: z.string().optional().describe("Specific functions to test (comma-separated)"),
      },
    },
    ({ contract_name, functions }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me write comprehensive tests for the ${contract_name} contract.

${functions ? `Focus on these functions: ${functions}` : "Test all public functions."}

Please:
1. First, inspect the contract ABI to understand its interface
2. Create a test file following Foundry conventions
3. Include:
   - Setup function with proper contract deployment
   - Unit tests for each function
   - Edge case tests (zero values, max values, access control)
   - Fuzz tests where appropriate
   - Event emission tests
4. Use proper assertions and labels
5. Follow the Arrange-Act-Assert pattern

Contract: ${contract_name}`,
          },
        },
      ],
    })
  );

  // Explain storage layout prompt
  server.registerPrompt(
    "explain_storage",
    {
      description: "Explain the storage layout of a contract",
      argsSchema: {
        contract_name: z.string().describe("Name of the contract to analyze"),
      },
    },
    ({ contract_name }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Explain the storage layout of the ${contract_name} contract.

Please:
1. Get the storage layout using forge inspect ${contract_name} storageLayout
2. Explain each storage slot and what variables it contains
3. Identify any packed variables
4. Point out potential storage collision risks (for upgradeable contracts)
5. Calculate the total storage slots used
6. Suggest any optimizations to reduce storage costs

Contract: ${contract_name}`,
          },
        },
      ],
    })
  );

  // Gas optimization prompt
  server.registerPrompt(
    "gas_optimization",
    {
      description: "Review a contract for gas optimization opportunities",
      argsSchema: {
        contract_name: z.string().describe("Name of the contract to optimize"),
      },
    },
    ({ contract_name }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Review the ${contract_name} contract for gas optimization opportunities.

Please:
1. Get the gas estimates using forge inspect ${contract_name} gasEstimates
2. Run the tests with gas reporting (forge test --gas-report)
3. Identify the most gas-intensive functions
4. Look for common optimization patterns:
   - Storage vs memory usage
   - Loop optimizations
   - Packing variables
   - Caching storage reads
   - Using unchecked blocks where safe
   - Reducing external calls
5. Suggest specific code changes with expected gas savings
6. Note any trade-offs between gas and readability

Contract: ${contract_name}`,
          },
        },
      ],
    })
  );

  // Security review prompt
  server.registerPrompt(
    "security_review",
    {
      description: "Perform a security review of a contract",
      argsSchema: {
        contract_name: z.string().describe("Name of the contract to review"),
      },
    },
    ({ contract_name }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Perform a security review of the ${contract_name} contract.

Please check for:
1. Reentrancy vulnerabilities
2. Integer overflow/underflow (if using Solidity < 0.8.0)
3. Access control issues
4. Front-running risks
5. Oracle manipulation (if using external data)
6. Flash loan attack vectors
7. Denial of service vectors
8. Centralization risks
9. Upgrade safety (if upgradeable)
10. Event emission for critical operations

Use the following tools:
- forge inspect to examine the contract structure
- Run tests with invariants to verify safety properties
- Check for proper use of checks-effects-interactions pattern

Contract: ${contract_name}`,
          },
        },
      ],
    })
  );

  // Fork and test prompt
  server.registerPrompt(
    "fork_test",
    {
      description: "Test a contract against a forked mainnet state",
      argsSchema: {
        contract_address: z.string().describe("Address of the contract to test"),
        network: z.string().optional().describe("Network to fork (default: mainnet)"),
        block: z.string().optional().describe("Block number to fork at"),
      },
    },
    ({ contract_address, network, block }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me test against a forked ${network || "mainnet"} state.

Contract address: ${contract_address}
${block ? `Fork at block: ${block}` : "Fork at latest block"}

Please:
1. Start Anvil with the fork (anvil --fork-url <RPC_URL>${block ? ` --fork-block-number ${block}` : ""})
2. Generate the interface for the contract using cast interface
3. Create a test that:
   - Uses vm.createSelectFork() for the fork
   - Interacts with the real contract
   - Uses vm.prank() to impersonate relevant accounts
4. Run the test against the fork
5. Clean up the Anvil instance when done

Target: ${contract_address}`,
          },
        },
      ],
    })
  );

  // Create script prompt
  server.registerPrompt(
    "create_script",
    {
      description: "Create a Foundry script for deployment or automation",
      argsSchema: {
        name: z.string().describe("Name of the script"),
        purpose: z.string().describe("What the script should do"),
      },
    },
    ({ name, purpose }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me create a Foundry script named ${name}.

Purpose: ${purpose}

Please:
1. Create a script file in the script/ directory
2. Follow Foundry script conventions:
   - Inherit from Script
   - Use vm.startBroadcast()/vm.stopBroadcast()
   - Proper function naming (run, deploy, etc.)
3. Include safety checks and logging
4. Add dry-run support (--simulate flag)
5. Show how to run the script with forge script

Script name: ${name}
Purpose: ${purpose}`,
          },
        },
      ],
    })
  );

  // Lookup command documentation
  server.registerPrompt(
    "lookup_docs",
    {
      description: "Look up documentation for a Foundry command or feature",
      argsSchema: {
        topic: z.string().describe("The command or feature to look up (e.g., 'forge test', 'cheatcodes', 'cast call')"),
      },
    },
    ({ topic }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me understand how to use: ${topic}

Please:
1. First, use the appropriate help tool to get the latest CLI documentation:
   - For forge commands: use forge_help with the subcommand
   - For cast commands: use cast_help with the subcommand
   - For anvil: use anvil_help
   - For chisel: use chisel_help with the subcommand

2. If more context is needed, check the foundry://docs resource for comprehensive documentation

3. Provide a clear explanation with:
   - What the command/feature does
   - Common use cases
   - Example commands
   - Important flags and options

4. Reference the official documentation:
   - Web docs: https://getfoundry.sh
   - LLM-optimized docs: https://getfoundry.sh/llms-full.txt

Topic: ${topic}

Note: Foundry is actively developed and documentation may change. Always verify with --help or official docs for the most current information.`,
          },
        },
      ],
    })
  );
}
