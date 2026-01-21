# @maxencerb/foundry-mcp

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for the [Foundry](https://getfoundry.sh/) Ethereum development toolkit. This server enables AI assistants like Claude to interact with Forge, Cast, Anvil, and Chisel directly.

## Features

- **80+ Tools** covering all major Foundry commands
- **Resources** for project configuration, ABIs, bytecode, and documentation
- **Prompts** for common workflows (deployment, testing, security review)
- **Self-documenting** with live `--help` integration and official docs fetching

### Tools Overview

| Category | Tools | Description |
|----------|-------|-------------|
| **Forge** | 18 | Build, test, deploy, verify contracts |
| **Cast** | 38 | Interact with EVM chains, encode/decode data |
| **Anvil** | 16 | Local node management, state manipulation |
| **Chisel** | 6 | Solidity REPL operations |
| **Help** | 6 | Live documentation from `--help` flags |

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Foundry](https://getfoundry.sh/) installed and in PATH

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Installation

```bash
# Using bun
bunx @maxencerb/foundry-mcp

# Or install globally
bun install -g @maxencerb/foundry-mcp
```

## Usage

### With Claude Code

Add the MCP server using the CLI:

```bash
# Add with environment variables
claude mcp add --transport stdio --env RPC_URL=http://localhost:8545 foundry -- bunx @maxencerb/foundry-mcp

# Or add project-scoped (creates .mcp.json)
claude mcp add --transport stdio --scope project foundry -- bunx @maxencerb/foundry-mcp
```

Or create a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "foundry": {
      "command": "bunx",
      "args": ["@maxencerb/foundry-mcp"],
      "env": {
        "RPC_URL": "${RPC_URL:-http://localhost:8545}"
      }
    }
  }
}
```

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "foundry": {
      "command": "bunx",
      "args": ["@maxencerb/foundry-mcp"],
      "env": {
        "RPC_URL": "http://localhost:8545"
      }
    }
  }
}
```

### With Other MCP Clients

```bash
# Run the server directly
bunx @maxencerb/foundry-mcp

# Or if installed globally
foundry-mcp
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | Default RPC endpoint for chain interactions | - |
| `PRIVATE_KEY` | Default private key for transactions (⚠️ testing only) | - |
| `FOUNDRY_PROJECT` | Path to Foundry project | Current directory |

## Available Tools

### Forge Tools

| Tool | Description |
|------|-------------|
| `forge_init` | Initialize a new Foundry project |
| `forge_build` | Compile Solidity contracts |
| `forge_test` | Run tests with filtering and forking |
| `forge_coverage` | Generate test coverage reports |
| `forge_script` | Execute deployment scripts |
| `forge_create` | Deploy a single contract |
| `forge_verify` | Verify contracts on block explorers |
| `forge_inspect` | Inspect ABI, bytecode, storage layout |
| `forge_flatten` | Flatten contract sources |
| `forge_remappings` | Show import remappings |
| `forge_tree` | Show dependency tree |
| `forge_clean` | Remove build artifacts |
| `forge_install` | Install dependencies |
| `forge_update` | Update dependencies |
| `forge_fmt` | Format Solidity code |
| `forge_snapshot` | Generate gas snapshots |
| `forge_doc` | Generate documentation |
| `forge_selectors` | List function selectors |

### Cast Tools

**Chain & Block:**
`cast_block`, `cast_block_number`, `cast_chain`, `cast_chain_id`, `cast_client`, `cast_gas_price`, `cast_base_fee`

**Account:**
`cast_balance`, `cast_nonce`, `cast_code`, `cast_storage`

**Transactions:**
`cast_call`, `cast_send`, `cast_publish`, `cast_tx`, `cast_receipt`, `cast_run`, `cast_estimate`, `cast_logs`

**Encoding/Decoding:**
`cast_abi_encode`, `cast_abi_decode`, `cast_calldata`, `cast_calldata_decode`, `cast_sig`, `cast_sig_event`, `cast_4byte`, `cast_4byte_decode`

**Utilities:**
`cast_to_wei`, `cast_from_wei`, `cast_to_hex`, `cast_to_dec`, `cast_to_base`, `cast_keccak`, `cast_resolve_name`, `cast_lookup_address`, `cast_compute_address`, `cast_create2`, `cast_interface`, `cast_age`, `cast_wallet_new`, `cast_wallet_address`, `cast_wallet_sign`, `cast_format_bytes32`, `cast_parse_bytes32`, `cast_concat_hex`

### Anvil Tools

| Tool | Description |
|------|-------------|
| `anvil_start` | Start a local Ethereum node |
| `anvil_stop` | Stop a running node |
| `anvil_status` | Check node status |
| `anvil_mine` | Mine blocks |
| `anvil_setBalance` | Set account balance |
| `anvil_setCode` | Set contract bytecode |
| `anvil_setStorageAt` | Set storage slot value |
| `anvil_impersonateAccount` | Impersonate an account |
| `anvil_stopImpersonatingAccount` | Stop impersonating |
| `anvil_snapshot` | Create state snapshot |
| `anvil_revert` | Revert to snapshot |
| `anvil_setNextBlockTimestamp` | Set next block timestamp |
| `anvil_increaseTime` | Increase block time |
| `anvil_setAutomine` | Toggle auto-mining |
| `anvil_reset` | Reset fork state |
| `anvil_getAccounts` | List dev accounts |

### Chisel Tools

| Tool | Description |
|------|-------------|
| `chisel_eval` | Evaluate Solidity expression |
| `chisel_run` | Run Solidity statements |
| `chisel_list` | List saved sessions |
| `chisel_load` | Load a session |
| `chisel_view` | View session source |
| `chisel_clear_cache` | Clear cache |

### Help Tools

| Tool | Description |
|------|-------------|
| `forge_help` | Get forge CLI help (supports subcommands) |
| `cast_help` | Get cast CLI help (supports subcommands) |
| `anvil_help` | Get anvil CLI help |
| `chisel_help` | Get chisel CLI help |
| `foundry_version` | Get installed Foundry versions |
| `foundry_list_commands` | List available commands for a tool |

## Available Resources

| Resource | URI | Description |
|----------|-----|-------------|
| Config | `foundry://config` | Project's foundry.toml |
| Remappings | `foundry://remappings` | Import remappings |
| Contracts | `foundry://contracts` | List of .sol files |
| ABI | `foundry://abi/{contract}` | Contract ABI |
| Bytecode | `foundry://bytecode/{contract}` | Contract bytecode |
| Storage Layout | `foundry://storage-layout/{contract}` | Storage layout |
| Method IDs | `foundry://method-identifiers/{contract}` | Function selectors |
| Gas Estimates | `foundry://gas-estimates/{contract}` | Gas estimates |
| Documentation | `foundry://docs` | Official Foundry docs |
| Doc Links | `foundry://docs/links` | Documentation URLs |

## Available Prompts

| Prompt | Description |
|--------|-------------|
| `deploy_contract` | Guide for deploying a contract |
| `debug_test` | Help debug a failing test |
| `write_test` | Generate tests for a contract |
| `explain_storage` | Explain storage layout |
| `gas_optimization` | Review for gas optimization |
| `security_review` | Security review checklist |
| `fork_test` | Test against forked state |
| `create_script` | Create deployment script |
| `lookup_docs` | Look up command documentation |

## Development

```bash
# Clone the repository
git clone https://github.com/maxencerb/foundry-mcp.git
cd foundry-mcp

# Install dependencies
bun install

# Run in development mode
bun run dev

# Type check
bun run typecheck

# Test with MCP Inspector
bun run inspect
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add a changeset: `bunx changeset`
4. Submit a pull request

## Security Notice

⚠️ **Never use private keys with real funds** when using this MCP server. LLMs can make mistakes and send unintended transactions. Use only for testing and development with test accounts.

## Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [Foundry LLM Docs](https://getfoundry.sh/llms-full.txt)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Setup](https://code.claude.com/docs/en/mcp)

## License

MIT
