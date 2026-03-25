# Changelog

## [2.0.0] — 2025-03-25

Full rewrite of the CLI from Node.js to Rust.

### Rewritten

- Entire CLI rewritten in Rust — ships as a single self-contained binary (~1.9 MB) with all templates embedded at compile time. No Node.js runtime required.
- Interactive prompts rebuilt with `dialoguer` (replaces `inquirer`), CLI parsing with `clap` (replaces manual `process.argv` handling).

### Fixed

- **Default + Hardhat templates never scaffolded.** `ScaffoldDefaultHardhat.js` logged a message but never called the copy function. All 9 template combinations (3 templates × 3 framework/language options) now work.
- **Dependency installation was asked but never ran.** v1 prompted "Install dependencies?" but the answer was silently discarded — no `npm install` ever executed. v2 actually runs `npm install` (Hardhat) or `forge install` (Foundry) when the user opts in.
- **Scaffold race conditions.** `scaffoldERC20` and `scaffoldERC721` were called without `await` in `processOptions.js`, and `ScaffoldERC20Hardhat.js` also fired `copyTemplateFiles` without `await`. Rust's synchronous execution eliminates these entirely.
- **Broken update hint.** `checkForUpdates` printed `npm install -g @latest` (missing the package name). Removed in v2 since distribution is a compiled binary.
- **DiamondUtils FFI selector generation.** `forge inspect` now outputs a table by default instead of JSON. Updated all Foundry template `DiamondUtils.sol` to pass `--json` to the FFI call so selector generation works with current forge versions.
- **Stale nested directory.** `default/hardhat/typescript/javascript/` was an accidental duplicate JavaScript project inside the TypeScript template. Removed.
- **`.gitkeep` files copied into scaffolded projects.** These were only needed for git tracking of the template directory. v2 filters them out during extraction.
- **Function misname.** `scaffoldERC721Foundry.js` internally defined a function named `scaffoldERC20Foundry` (copy-paste error). Not carried forward.
- **Unused dependencies.** v1 shipped `chalk` and `gradient-string` in `package.json` but never imported them. v2 has zero unused dependencies.
- **Empty modules.** `logger.js` and `templateFoler.js` (sic) were empty files with no exports. Not carried forward.

### Added

- **`diamonds convert` command.** Pass any flat Solidity contract and get back a full EIP-2535 Diamond project. The engine parses the contract with `solang-parser`, extracts state variables into a `LibAppStorage` diamond storage library, rewrites function bodies to use shared storage, converts constructors into `DiamondInit.init()`, generates a facet + interface + deployment test, and copies in all standard Diamond plumbing (Diamond.sol, DiamondCut, Loupe, Ownership, LibDiamond). Currently supports Foundry output with flat single-contract inputs (no inheritance).
- **Git initialization.** Optional `git init` after scaffolding. Automatically enabled when the user selects Foundry + install dependencies, since `forge install` requires a git repository.
- **Progress spinners.** Visual feedback during scaffolding, git init, and dependency installation via `indicatif`.
- **Foundry lib directory creation.** Parses `.gitmodules` and creates the empty `lib/` subdirectories (e.g. `lib/forge-std`) so `forge install` can populate them.
- **Input validation.** Project name validated inline (no spaces, not empty). Target directory checked for conflicts before prompting continues.
- **Proper error handling.** All operations return `Result` with contextual error messages via `anyhow`. No silent failures, no swallowed errors.
- **Graceful dependency install failures.** If `forge`/`npm` is not found or fails, the CLI prints a warning and manual instructions instead of crashing.
- **CLI subcommand structure.** `diamonds init [name]` with optional positional project name to skip the name prompt.
- **Release profile optimization.** Binary is stripped, LTO-enabled, and size-optimized (`opt-level = "z"`).

### Changed

- **Template descriptions improved.** Prompt options now include short descriptions (e.g. "Default — Diamond proxy with core facets") instead of bare names.
- **TypeScript listed first** in the language prompt (marked as recommended) instead of JavaScript.
- **Framework descriptions added.** "Foundry — Blazing-fast Solidity framework (Rust toolchain)" and "Hardhat — Flexible Ethereum dev environment (Node.js)".
- **`diamonds update` command removed.** Not applicable for a compiled binary. Users update by downloading a new release.

### Removed

- Node.js runtime dependency.
- `chalk`, `colors`, `figlet`, `fs-extra`, `gradient-string`, `inquirer` npm dependencies.
- `diamonds update` subcommand.

### Template Fixes (v2.0.1)

#### Critical (Security / Build-Breaking)
- **ERC721 `approve()` had no authorization check.** Anyone could approve themselves and steal tokens. Now verifies `msg.sender` is the token owner or an approved operator.
- **ERC721 `safeMint()` had no access control.** Anyone could mint arbitrary NFTs. Now requires `enforceIsContractOwner()`.
- **ERC721 `setApprovalForAll()` never emitted `ApprovalForAll` event.** Violated ERC-721 spec. Now emits the required event.
- **`winterface` typo** in ERC721 Hardhat TypeScript `IERC721Errors.sol` prevented compilation.
- **ERC721 Foundry `foundry.toml`** had `src = "src"` but contracts live in `contracts/`, and `ffi = true` was missing. Template was completely broken.
- **ERC20 Diamond constructor mismatch.** Foundry used 5 args (name, symbol, decimals) while Hardhat used 2. Standardized all to 2-arg constructor with metadata set via `DiamondInit`.

#### High (Correctness)
- **Foundry tests never ran `DiamondInit`.** All 3 Foundry test files called `diamondCut(..., address(0), "")`, so `supportsInterface` was never populated. Now properly deploys and calls `DiamondInit`.
- **ERC-165 never registered token interfaces.** `DiamondInit` only set IERC165/IDiamondCut/IDiamondLoupe/IERC173. Now also registers `IERC20` (ERC20 templates) and `IERC721` (ERC721 templates).
- **ERC721 test used wrong revert expectations.** `testFail*` pattern with string comparisons for custom errors. Rewritten with proper `vm.expectRevert(abi.encodeWithSelector(...))`.
- **Added `IERC20` interface.** ERC20 templates had no standard IERC20 interface. Created it and `ERC20Facet` now implements it.
- **ERC721 `ownerOf()` used `require` string** instead of `ERC721NonexistentToken` custom error. Fixed for consistency.
- **ERC721 dual transfer paths.** `_transfer` reimplemented balance/owner logic independently of `_update`, risking divergence. `_transfer` now delegates to `_update`.

#### Medium (Code Quality)
- **`InValidFacetCutAction` typo** in all `LibDiamond.sol` copies → `InvalidFacetCutAction`.
- **`initializeDiamondCut` error bubbling** used `revert(string(error))` which corrupts ABI-encoded error data. Now uses `assembly { revert(add(32, error), mload(error)) }`.
- **Diamond.sol fallback** used `require(facet != address(0), "...")` string revert. Replaced with `FunctionNotFound(bytes4)` custom error.
- **Missing SPDX/pragma** on `IERC20Errors.sol`, `IERC20Events.sol`, `IERC721Errors.sol`, and `DiamondUtils.sol`. Added proper headers.
- **`IERC721Errors.sol` bundled IERC20/IERC721/IERC1155 errors.** Split to only contain relevant errors per template.
- **Removed unused ERC20 interfaces from ERC721 templates** and vice versa.
- **ERC20Facet.sol pragma inconsistency.** Hardhat copies used `^0.8.20` while everything else used `^0.8.0`. Standardized.
- **`IERC721.sol`** used `^0.8.20` pragma and had double-space typo. Fixed.
- **Hardhat compiler version drift.** ERC721 templates used `0.8.27` while others used `0.8.24`. Standardized to `0.8.24`.
- **`package.json`** names were all `hardhat-project`. Now `diamond-project`, `diamond-erc20`, `diamond-erc721`.
- **Hardhat version drift.** Standardized to `^2.22.17` across all templates.
- **`DiamondUtils` dead code.** Removed unused `selectr` variable, fixed `uint` → `uint256`.

#### Low (Boilerplate / Polish)
- **`Diamond.sol` `example()` function** removed from all templates. Not appropriate for production scaffolds.
- **Foundry READMEs** replaced generic `Counter.s.sol` boilerplate with diamond-specific documentation.
- **Hardhat READMEs** replaced sample Lock/Ignition boilerplate with diamond-specific documentation.
- **Ignition `Lock` modules** deleted (deployed nonexistent `Lock` contract).
- **`DiamondInit` comment typos** fixed (`exapected` → expected, `funciton` → function).
- **CI workflow** removed invalid `FOUNDRY_PROFILE: ci` env (no `[profile.ci]` existed).
- **`.gitmodules`** entries uncommented in default/ERC20 Foundry, created for ERC721 Foundry.
- **Hardhat test descriptions** fixed ("three facets" → "four facets" where 4 are actually deployed).
- **Hardhat ERC721 test** fixed `revertedWith('ERC721: invalid token ID')` → `revertedWithCustomError('ERC721NonexistentToken')`.
- **Added `DiamondInit.sol` to default Foundry template** (was missing entirely).
- **Deploy scripts** for ERC20/ERC721 Hardhat updated to pass metadata params to `DiamondInit.init()`.

## [1.0.6] — Previous

Original Node.js implementation. Published as `diamondscaffold` on npm with the `diamonds` binary.
