import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec, buildArgs, formatOutput, textContent } from "../utils/exec.ts";
import type { ToolContext } from "../utils/types.ts";
import {
  addressSchema,
  txHashSchema,
  hexDataSchema,
  functionSigSchema,
  rpcUrlSchema,
  privateKeySchema,
  ethUnitSchema,
} from "../utils/validation.ts";

function getRpcUrl(rpcUrl: string | undefined, context: ToolContext): string | undefined {
  return rpcUrl || context.rpcUrl;
}

function getPrivateKey(privateKey: string | undefined, context: ToolContext): string | undefined {
  return privateKey || context.privateKey;
}

export function registerCastTools(server: McpServer, context: ToolContext) {
  // =========== Block & Chain ===========

  server.registerTool(
    "cast_block",
    {
      description: "Get information about a block",
      inputSchema: {
        block: z.union([z.string(), z.number()]).optional().describe("Block number, hash, or tag (default: latest)"),
        full: z.boolean().optional().describe("Include full transaction objects"),
        json: z.boolean().optional().describe("Output as JSON"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ block, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      if (block !== undefined) args.unshift(String(block));
      const result = await exec("cast", ["block", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_block_number",
    {
      description: "Get the latest block number",
      inputSchema: {
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async (options) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["block-number", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_chain",
    {
      description: "Get the symbolic chain name",
      inputSchema: {
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async (options) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["chain", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_chain_id",
    {
      description: "Get the chain ID",
      inputSchema: {
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async (options) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["chain-id", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_client",
    {
      description: "Get the client version",
      inputSchema: {
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async (options) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["client", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_gas_price",
    {
      description: "Get the current gas price",
      inputSchema: {
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async (options) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["gas-price", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_base_fee",
    {
      description: "Get the base fee of a block",
      inputSchema: {
        block: z.union([z.string(), z.number()]).optional().describe("Block number or tag"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ block, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      if (block !== undefined) args.unshift(String(block));
      const result = await exec("cast", ["base-fee", ...args]);
      return textContent(formatOutput(result));
    }
  );

  // =========== Account & Wallet ===========

  server.registerTool(
    "cast_balance",
    {
      description: "Get the ETH balance of an address",
      inputSchema: {
        address: z.string().describe("Address or ENS name"),
        ether: z.boolean().optional().describe("Display balance in ether"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["balance", address, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_nonce",
    {
      description: "Get the nonce of an address",
      inputSchema: {
        address: z.string().describe("Address or ENS name"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["nonce", address, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_code",
    {
      description: "Get the bytecode at an address",
      inputSchema: {
        address: z.string().describe("Contract address"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["code", address, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_storage",
    {
      description: "Read a storage slot of a contract",
      inputSchema: {
        address: z.string().describe("Contract address"),
        slot: z.string().describe("Storage slot (number or hex)"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ address, slot, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["storage", address, slot, ...args]);
      return textContent(formatOutput(result));
    }
  );

  // =========== Transactions ===========

  server.registerTool(
    "cast_call",
    {
      description: "Call a contract function without state changes (eth_call)",
      inputSchema: {
        to: z.string().describe("Target contract address"),
        sig: functionSigSchema.describe("Function signature (e.g., 'balanceOf(address)')"),
        args: z.array(z.string()).optional().describe("Function arguments"),
        from: z.string().optional().describe("Sender address for the call"),
        block: z.union([z.string(), z.number()]).optional().describe("Block to query"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ to, sig, args: callArgs, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const baseArgs = buildArgs(options);
      const cmdArgs = [to, sig, ...(callArgs || []), ...baseArgs];
      const result = await exec("cast", ["call", ...cmdArgs]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_send",
    {
      description: "Send a transaction to a contract",
      inputSchema: {
        to: z.string().describe("Target contract address"),
        sig: functionSigSchema.describe("Function signature"),
        args: z.array(z.string()).optional().describe("Function arguments"),
        value: z.string().optional().describe("ETH value to send"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
        "private-key": privateKeySchema.describe("Private key for signing"),
        legacy: z.boolean().optional().describe("Use legacy transaction"),
        json: z.boolean().optional().describe("Output as JSON"),
      },
    },
    async ({ to, sig, args: callArgs, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      options["private-key"] = getPrivateKey(options["private-key"], context);
      const baseArgs = buildArgs(options);
      const cmdArgs = [to, sig, ...(callArgs || []), ...baseArgs];
      const result = await exec("cast", ["send", ...cmdArgs]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_publish",
    {
      description: "Publish a signed raw transaction",
      inputSchema: {
        tx: hexDataSchema.describe("Signed transaction data"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ tx, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["publish", tx, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_tx",
    {
      description: "Get information about a transaction",
      inputSchema: {
        "tx-hash": txHashSchema.describe("Transaction hash"),
        json: z.boolean().optional().describe("Output as JSON"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ "tx-hash": txHash, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["tx", txHash, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_receipt",
    {
      description: "Get the transaction receipt",
      inputSchema: {
        "tx-hash": txHashSchema.describe("Transaction hash"),
        json: z.boolean().optional().describe("Output as JSON"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ "tx-hash": txHash, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["receipt", txHash, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_run",
    {
      description: "Replay a transaction locally for debugging",
      inputSchema: {
        "tx-hash": txHashSchema.describe("Transaction hash to replay"),
        debug: z.boolean().optional().describe("Open in debugger"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ "tx-hash": txHash, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["run", txHash, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_estimate",
    {
      description: "Estimate gas for a transaction",
      inputSchema: {
        to: z.string().describe("Target address"),
        sig: functionSigSchema.optional().describe("Function signature"),
        args: z.array(z.string()).optional().describe("Function arguments"),
        value: z.string().optional().describe("ETH value"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ to, sig, args: callArgs, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const baseArgs = buildArgs(options);
      const cmdArgs = [to];
      if (sig) cmdArgs.push(sig, ...(callArgs || []));
      cmdArgs.push(...baseArgs);
      const result = await exec("cast", ["estimate", ...cmdArgs]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_logs",
    {
      description: "Query event logs",
      inputSchema: {
        sig: z.string().optional().describe("Event signature"),
        address: z.string().optional().describe("Contract address to filter"),
        "from-block": z.union([z.string(), z.number()]).optional().describe("Start block"),
        "to-block": z.union([z.string(), z.number()]).optional().describe("End block"),
        topics: z.array(z.string()).optional().describe("Topic filters"),
        json: z.boolean().optional().describe("Output as JSON"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ sig, topics, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      if (sig) args.unshift(sig);
      if (topics) {
        for (const topic of topics) {
          args.push("--topic", topic);
        }
      }
      const result = await exec("cast", ["logs", ...args]);
      return textContent(formatOutput(result));
    }
  );

  // =========== Encoding/Decoding ===========

  server.registerTool(
    "cast_abi_encode",
    {
      description: "ABI encode function arguments",
      inputSchema: {
        sig: functionSigSchema.describe("Function signature"),
        args: z.array(z.string()).describe("Arguments to encode"),
      },
    },
    async ({ sig, args: encodeArgs }) => {
      const result = await exec("cast", ["abi-encode", sig, ...encodeArgs]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_abi_decode",
    {
      description: "ABI decode data",
      inputSchema: {
        sig: functionSigSchema.describe("Function signature (outputs only, e.g., '(uint256,address)')"),
        data: hexDataSchema.describe("Data to decode"),
        input: z.boolean().optional().describe("Decode as input data"),
      },
    },
    async ({ sig, data, input }) => {
      const args = input ? ["--input"] : [];
      const result = await exec("cast", ["abi-decode", sig, data, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_calldata",
    {
      description: "Encode function call as calldata",
      inputSchema: {
        sig: functionSigSchema.describe("Function signature"),
        args: z.array(z.string()).optional().describe("Function arguments"),
      },
    },
    async ({ sig, args: encodeArgs }) => {
      const result = await exec("cast", ["calldata", sig, ...(encodeArgs || [])]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_calldata_decode",
    {
      description: "Decode calldata using function signature",
      inputSchema: {
        sig: functionSigSchema.describe("Function signature"),
        calldata: hexDataSchema.describe("Calldata to decode"),
      },
    },
    async ({ sig, calldata }) => {
      const result = await exec("cast", ["calldata-decode", sig, calldata]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_sig",
    {
      description: "Get the selector (4-byte hash) of a function signature",
      inputSchema: {
        sig: functionSigSchema.describe("Function signature (e.g., 'transfer(address,uint256)')"),
      },
    },
    async ({ sig }) => {
      const result = await exec("cast", ["sig", sig]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_sig_event",
    {
      description: "Get the topic0 hash of an event signature",
      inputSchema: {
        sig: z.string().describe("Event signature"),
      },
    },
    async ({ sig }) => {
      const result = await exec("cast", ["sig-event", sig]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_4byte",
    {
      description: "Lookup function signatures for a selector from 4byte.directory",
      inputSchema: {
        selector: z.string().describe("4-byte selector (e.g., 0xa9059cbb)"),
      },
    },
    async ({ selector }) => {
      const result = await exec("cast", ["4byte", selector]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_4byte_decode",
    {
      description: "Decode calldata by looking up selector in 4byte.directory",
      inputSchema: {
        calldata: hexDataSchema.describe("Calldata to decode"),
      },
    },
    async ({ calldata }) => {
      const result = await exec("cast", ["4byte-decode", calldata]);
      return textContent(formatOutput(result));
    }
  );

  // =========== Utilities ===========

  server.registerTool(
    "cast_to_wei",
    {
      description: "Convert a value to wei",
      inputSchema: {
        value: z.string().describe("Value to convert"),
        unit: ethUnitSchema.optional().describe("Unit of input (default: ether)"),
      },
    },
    async ({ value, unit }) => {
      const args = unit ? [value, unit] : [value];
      const result = await exec("cast", ["to-wei", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_from_wei",
    {
      description: "Convert wei to another unit",
      inputSchema: {
        value: z.string().describe("Value in wei"),
        unit: ethUnitSchema.optional().describe("Target unit (default: ether)"),
      },
    },
    async ({ value, unit }) => {
      const args = unit ? [value, unit] : [value];
      const result = await exec("cast", ["from-wei", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_to_hex",
    {
      description: "Convert a value to hex",
      inputSchema: {
        value: z.string().describe("Value to convert"),
      },
    },
    async ({ value }) => {
      const result = await exec("cast", ["to-hex", value]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_to_dec",
    {
      description: "Convert hex to decimal",
      inputSchema: {
        value: z.string().describe("Hex value to convert"),
      },
    },
    async ({ value }) => {
      const result = await exec("cast", ["to-dec", value]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_to_base",
    {
      description: "Convert a number to a different base",
      inputSchema: {
        value: z.string().describe("Value to convert"),
        base: z.enum(["2", "8", "10", "16"]).describe("Target base"),
      },
    },
    async ({ value, base }) => {
      const result = await exec("cast", ["to-base", value, base]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_keccak",
    {
      description: "Compute the keccak256 hash of data",
      inputSchema: {
        data: z.string().describe("Data to hash (string or hex with 0x prefix)"),
      },
    },
    async ({ data }) => {
      const result = await exec("cast", ["keccak", data]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_resolve_name",
    {
      description: "Resolve an ENS name to an address",
      inputSchema: {
        name: z.string().describe("ENS name to resolve"),
        "rpc-url": rpcUrlSchema.describe("RPC URL (must support ENS)"),
      },
    },
    async ({ name, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["resolve-name", name, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_lookup_address",
    {
      description: "Reverse lookup an address to find ENS name",
      inputSchema: {
        address: addressSchema.describe("Address to lookup"),
        "rpc-url": rpcUrlSchema.describe("RPC URL (must support ENS)"),
      },
    },
    async ({ address, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      const result = await exec("cast", ["lookup-address", address, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_compute_address",
    {
      description: "Compute the address of a contract deployed by CREATE",
      inputSchema: {
        address: z.string().describe("Deployer address"),
        nonce: z.number().int().nonnegative().optional().describe("Deployer nonce"),
        "rpc-url": rpcUrlSchema.describe("RPC URL (to fetch nonce if not provided)"),
      },
    },
    async ({ address, nonce, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      if (nonce !== undefined) args.push("--nonce", String(nonce));
      const result = await exec("cast", ["compute-address", address, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_create2",
    {
      description: "Compute CREATE2 deployment address",
      inputSchema: {
        starts_with: z.string().optional().describe("Find salt that produces address starting with this"),
        ends_with: z.string().optional().describe("Find salt that produces address ending with this"),
        deployer: z.string().optional().describe("Deployer address"),
        init_code_hash: z.string().optional().describe("Init code hash"),
        salt: z.string().optional().describe("Salt value"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("cast", ["create2", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_interface",
    {
      description: "Generate a Solidity interface from contract ABI",
      inputSchema: {
        address_or_path: z.string().describe("Contract address or path to ABI file"),
        name: z.string().optional().describe("Interface name"),
        "rpc-url": rpcUrlSchema.describe("RPC URL (if address provided)"),
      },
    },
    async ({ address_or_path, name, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      if (name) args.push("-n", name);
      const result = await exec("cast", ["interface", address_or_path, ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_age",
    {
      description: "Get the timestamp of a block as a human-readable date",
      inputSchema: {
        block: z.union([z.string(), z.number()]).optional().describe("Block number or tag"),
        "rpc-url": rpcUrlSchema.describe("RPC URL"),
      },
    },
    async ({ block, ...options }) => {
      options["rpc-url"] = getRpcUrl(options["rpc-url"], context);
      const args = buildArgs(options);
      if (block !== undefined) args.unshift(String(block));
      const result = await exec("cast", ["age", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_wallet_new",
    {
      description: "Generate a new random wallet",
      inputSchema: {
        json: z.boolean().optional().describe("Output as JSON"),
      },
    },
    async (options) => {
      const args = buildArgs(options);
      const result = await exec("cast", ["wallet", "new", ...args]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_wallet_address",
    {
      description: "Get the address from a private key",
      inputSchema: {
        "private-key": privateKeySchema.describe("Private key"),
      },
    },
    async (options) => {
      const pk = getPrivateKey(options["private-key"], context);
      if (!pk) {
        return textContent("Error: Private key is required");
      }
      const result = await exec("cast", ["wallet", "address", "--private-key", pk]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_wallet_sign",
    {
      description: "Sign a message with a private key",
      inputSchema: {
        message: z.string().describe("Message to sign"),
        "private-key": privateKeySchema.describe("Private key for signing"),
      },
    },
    async ({ message, ...options }) => {
      const pk = getPrivateKey(options["private-key"], context);
      if (!pk) {
        return textContent("Error: Private key is required");
      }
      const result = await exec("cast", ["wallet", "sign", message, "--private-key", pk]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_format_bytes32",
    {
      description: "Format a string as bytes32",
      inputSchema: {
        value: z.string().describe("String to format"),
      },
    },
    async ({ value }) => {
      const result = await exec("cast", ["format-bytes32-string", value]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_parse_bytes32",
    {
      description: "Parse bytes32 back to string",
      inputSchema: {
        value: z.string().describe("Bytes32 value to parse"),
      },
    },
    async ({ value }) => {
      const result = await exec("cast", ["parse-bytes32-string", value]);
      return textContent(formatOutput(result));
    }
  );

  server.registerTool(
    "cast_concat_hex",
    {
      description: "Concatenate hex strings",
      inputSchema: {
        values: z.array(z.string()).describe("Hex values to concatenate"),
      },
    },
    async ({ values }) => {
      const result = await exec("cast", ["concat-hex", ...values]);
      return textContent(formatOutput(result));
    }
  );
}
