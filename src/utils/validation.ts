import { z } from "zod";

// Common address validation (0x + 40 hex chars)
export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

// Transaction hash validation (0x + 64 hex chars)
export const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

// Block identifier (number, hash, or tag)
export const blockIdSchema = z.union([
  z.number().int().nonnegative(),
  z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  z.enum(["latest", "earliest", "pending", "safe", "finalized"]),
]);

// Hex data validation
export const hexDataSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]*$/, "Invalid hex data");

// Function signature (e.g., "transfer(address,uint256)")
export const functionSigSchema = z
  .string()
  .min(1, "Function signature is required");

// RPC URL validation
export const rpcUrlSchema = z.string().url("Invalid RPC URL").optional();

// Solidity code validation
export const solidityCodeSchema = z.string().min(1, "Solidity code is required");

// Contract name validation
export const contractNameSchema = z
  .string()
  .min(1, "Contract name is required")
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid contract name");

// File path validation
export const filePathSchema = z.string().min(1, "File path is required");

// ETH units
export const ethUnitSchema = z.enum([
  "wei",
  "gwei",
  "ether",
  "kwei",
  "mwei",
  "szabo",
  "finney",
]);

// Verbosity level for forge commands
export const verbositySchema = z.number().int().min(0).max(5).optional();

// Private key validation (with or without 0x prefix)
export const privateKeySchema = z
  .string()
  .regex(
    /^(0x)?[a-fA-F0-9]{64}$/,
    "Invalid private key (must be 32 bytes hex)"
  )
  .optional();

// Chain identifiers for verification
export const chainSchema = z.union([
  z.number().int().positive(),
  z.string().min(1),
]);

// Common optional parameters
export const commonRpcParams = {
  "rpc-url": rpcUrlSchema,
};

export const commonTxParams = {
  "rpc-url": rpcUrlSchema,
  "private-key": privateKeySchema,
};
