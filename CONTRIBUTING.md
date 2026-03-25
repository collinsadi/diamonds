# Contributing to diamondscaffold

Thank you for your interest in contributing. This document covers everything you need to get started.

## Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for running template tests)
- [Node.js](https://nodejs.org/) >= 16 (for Hardhat template tests)
- Git

## Getting Started

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/diamonds.git
cd diamonds
```

### 2. Add the upstream remote

```bash
git remote add upstream https://github.com/collinsadi/diamonds.git
```

### 3. Build the CLI

```bash
cd v2
cargo build
```

### 4. Run it locally

```bash
cargo run -- init
cargo run -- convert path/to/Contract.sol
```

## Project Layout

```
v2/
├── src/
│   ├── main.rs           # CLI entry point and subcommand routing
│   ├── banner.rs          # ASCII banner
│   ├── prompt.rs          # Interactive prompts (dialoguer)
│   ├── scaffold.rs        # Template extraction and project scaffolding
│   └── convert/
│       ├── mod.rs         # Convert command orchestrator
│       ├── parser.rs      # Solidity AST parser (solang-parser)
│       └── codegen.rs     # Diamond code generator
├── templates/             # Embedded project templates (9 variants)
└── Cargo.toml
```

## Branching Strategy

Create a branch off `main` for every change. Use descriptive names:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/add-erc1155-template` |
| `fix/` | Bug fix | `fix/regex-false-positive` |
| `refactor/` | Code restructuring | `refactor/split-codegen` |
| `docs/` | Documentation | `docs/update-readme` |
| `chore/` | Maintenance | `chore/bump-dependencies` |
| `test/` | Tests | `test/convert-edge-cases` |

```bash
git checkout -b feat/my-feature
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

**Scopes** (optional): `v2`, `templates`, `npm`, `ci`

**Examples**:

```
feat(v2): add ERC1155 template support
fix(templates): correct DiamondInit parameter encoding
docs: update installation instructions
chore(ci): add Windows ARM64 build target
```

Keep commits atomic — one logical change per commit. Avoid mixing unrelated changes.

## Making Changes

### Templates

Templates live in `v2/templates/`. There are 9 variants:

- `default/foundry`, `default/hardhat/javascript`, `default/hardhat/typescript`
- `ERC20/foundry`, `ERC20/hardhat/javascript`, `ERC20/hardhat/typescript`
- `ERC721/foundry`, `ERC721/hardhat/javascript`, `ERC721/hardhat/typescript`

When editing a shared contract (like `LibDiamond.sol` or `Diamond.sol`), propagate the change to **all variants** that contain it. Inconsistencies between templates are bugs.

### Solidity contracts

- Use `pragma solidity ^0.8.0;` for maximum compatibility
- Include `// SPDX-License-Identifier: MIT` in every file
- Use custom errors instead of `require` strings
- Follow the Diamond Storage pattern for state management

### Rust code

- Run `cargo clippy` and fix any warnings before committing
- Run `cargo fmt` to ensure consistent formatting
- Keep public API surface minimal — prefer `pub(crate)` over `pub` where possible

### Tests

- Foundry template tests should pass with `forge test` after scaffolding
- Hardhat template tests should pass with `npx hardhat test` after scaffolding
- If you add a new template variant, include matching deploy scripts and test files

## Pull Requests

### Before opening a PR

1. Sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

2. Make sure the CLI compiles:

```bash
cd v2 && cargo check
```

3. Test your changes by scaffolding a project and running its tests:

```bash
cargo run -- init
cd <scaffolded-project>
forge test   # or npx hardhat test
```

### PR guidelines

- Fill out the PR description: what you changed and why
- Link related issues with `Closes #<number>`
- Keep PRs focused — one feature or fix per PR
- PRs that touch templates should include a note confirming all affected variants were updated
- Large PRs should be broken into reviewable chunks

### Review process

- A maintainer will review your PR
- Address feedback with new commits (don't force-push during review)
- Once approved, the PR will be squash-merged into `main`

## Reporting Issues

Before creating an issue:

1. Search existing issues to avoid duplicates
2. If one exists, comment on it rather than opening a new one

When creating a new issue:

- Use a clear, descriptive title: `Bug: scaffold fails with spaces in project name`
- Include steps to reproduce, expected behavior, and actual behavior
- Attach error output, screenshots, or logs when relevant
- Specify your OS, Rust version, and `diamonds --version`

If you'd like to work on an existing issue, comment on it and wait for assignment before starting.

## Code of Conduct

- Be respectful and constructive in all interactions
- Focus feedback on the code, not the person
- Ask questions when something is unclear
- Keep discussions on-topic

## Questions?

Open a [Discussion](https://github.com/collinsadi/diamonds/discussions) or comment on the relevant issue.
