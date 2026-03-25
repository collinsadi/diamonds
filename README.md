<div align="center">

# ◆ diamondscaffold

**The fastest way to build upgradeable smart contracts.**

Scaffold and convert [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535) projects in seconds.

Built in Rust. Zero runtime dependencies.

[![crates.io](https://img.shields.io/crates/v/diamondscaffold?style=flat-square&logo=rust&logoColor=white&label=crates.io&color=e6522c)](https://crates.io/crates/diamondscaffold)
[![npm](https://img.shields.io/npm/v/diamondscaffold?style=flat-square&logo=npm&logoColor=white&label=npm&color=cb3837)](https://www.npmjs.com/package/diamondscaffold)
[![license](https://img.shields.io/github/license/collinsadi/diamonds?style=flat-square&color=blue)](./LICENSE.md)

![Screenshot](./image.png)

</div>

---

## Why diamondscaffold?

The Diamond Standard (EIP-2535) gives you truly upgradeable contracts — but the boilerplate is brutal. `diamondscaffold` eliminates it:

- **`diamonds init`** — scaffold a full Diamond project with one command
- **`diamonds convert`** — feed in any `.sol` file, get a Diamond project back
- **Foundry & Hardhat** — first-class support for both, including JS and TS
- **Three templates** — Default, ERC20, ERC721 — production-ready out of the box
- **Single binary** — no Node.js runtime, no Python, no Docker. Just run it.

---

## Install

Choose your preferred method:

<table>
<tr>
<td><b>npm</b></td>
<td>

```bash
npm install -g diamondscaffold
```

</td>
</tr>
<tr>
<td><b>Cargo</b></td>
<td>

```bash
cargo install diamondscaffold
```

</td>
</tr>
<tr>
<td><b>Binary</b></td>
<td>

Download from [GitHub Releases](https://github.com/collinsadi/diamonds/releases) — macOS, Linux, Windows

</td>
</tr>
</table>

Verify:

```bash
diamonds --version
```

---

## Quick Start

### Scaffold a new Diamond project

```bash
diamonds init
```

Interactive prompts guide you through:

```
◆ Project name          → my-diamond
◆ Template              → Default / ERC20 / ERC721
◆ Framework             → Foundry / Hardhat
◆ Language (Hardhat)    → JavaScript / TypeScript
◆ Install dependencies  → yes / no
◆ Initialize git        → yes / no
```

Or skip the prompts:

```bash
diamonds init my-token
```

### Convert an existing contract

```bash
diamonds convert MyContract.sol
```

Takes any Solidity contract and generates a complete Diamond project:

| Generated File | What it does |
|----------------|-------------|
| `LibAppStorage.sol` | Storage library extracted from your state variables |
| `{Name}Facet.sol` | Your logic rewritten as an external facet |
| `I{Name}Facet.sol` | Interface for the facet |
| `DiamondInit.sol` | Initializer derived from your constructor |
| `deployDiamond.t.sol` | Deployment test with selector generation |
| Project config | `foundry.toml`, `.gitmodules`, README, CI workflow |

Options:

```bash
diamonds convert MyContract.sol --output my-diamond   # custom directory
diamonds convert MyContract.sol --framework hardhat    # Hardhat instead of Foundry
```

---

## Templates

| Template | What you get |
|----------|-------------|
| **Default** | Clean Diamond — DiamondCut, DiamondLoupe, Ownership facets, deploy test |
| **ERC20** | Full ERC20 token facet with mint/burn/transfer, interfaces, and tests |
| **ERC721** | Full ERC721 NFT facet with mint/transfer/approve, interfaces, and tests |

All templates include:
- `Diamond.sol` with custom error handling
- `LibDiamond.sol` with proper error bubbling
- `DiamondInit.sol` with metadata initialization
- Complete test suites
- Deploy scripts
- CI workflow (Foundry templates)

---

## After Scaffolding

### Foundry

```bash
forge build                    # compile contracts
forge test                     # run test suite
forge script Deploy --broadcast  # deploy
```

### Hardhat

```bash
npx hardhat compile                  # compile contracts
npx hardhat test                     # run test suite
npx hardhat run scripts/deploy.js    # deploy
```

---

## Project Structure

```
diamonds/
├── v2/                     # Rust CLI source
│   ├── src/
│   │   ├── main.rs         # Entry point + clap subcommands
│   │   ├── banner.rs       # CLI banner
│   │   ├── prompt.rs       # Interactive prompts
│   │   ├── scaffold.rs     # Template engine
│   │   └── convert/        # Solidity → Diamond converter
│   │       ├── mod.rs      # Orchestrator
│   │       ├── parser.rs   # Solidity AST parser
│   │       └── codegen.rs  # Code generator
│   └── templates/          # 9 embedded project templates
├── npm/                    # npm distribution (6 packages)
├── scripts/                # Release automation
├── .github/workflows/      # CI/CD pipeline
└── v1/                     # Legacy Node.js CLI (archived)
```

---

## Links

| Resource | URL |
|----------|-----|
| **npm** | [npmjs.com/package/diamondscaffold](https://www.npmjs.com/package/diamondscaffold) |
| **Crates.io** | [crates.io/crates/diamondscaffold](https://crates.io/crates/diamondscaffold) |
| **EIP-2535** | [eips.ethereum.org/EIPS/eip-2535](https://eips.ethereum.org/EIPS/eip-2535) |
| **Releases** | [github.com/collinsadi/diamonds/releases](https://github.com/collinsadi/diamonds/releases) |

---

## Contributing

Contributions welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

Using an AI assistant? Review [AI_POLICY.md](./AI_POLICY.md) first.

## License

MIT — see [LICENSE.md](./LICENSE.md).
