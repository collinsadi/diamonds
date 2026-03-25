use regex::Regex;

use super::parser::{ContractInfo, FunctionInfo, StateVar};

fn pragma_line(info: &ContractInfo) -> String {
    let p = info.pragma.trim_end().trim_end_matches(';');
    format!("{p};\n")
}

pub struct OutputFile {
    pub path: String,
    pub content: String,
}

pub fn generate(info: &ContractInfo) -> Vec<OutputFile> {
    let mut files = Vec::new();

    let storage_vars: Vec<&StateVar> = info
        .state_vars
        .iter()
        .filter(|v| !v.is_constant && !v.is_immutable)
        .collect();

    files.push(gen_app_storage(info, &storage_vars));
    files.push(gen_facet(info, &storage_vars));
    files.push(gen_interface(info));
    files.push(gen_diamond_init(info, &storage_vars));
    files.push(gen_test(info));
    files.push(gen_readme(info));

    files
}

// ---------------------------------------------------------------------------
// LibAppStorage.sol
// ---------------------------------------------------------------------------

fn gen_app_storage(info: &ContractInfo, storage_vars: &[&StateVar]) -> OutputFile {
    let mut out = String::new();
    out.push_str(&info.license);
    out.push('\n');
    out.push_str(&pragma_line(info));
    out.push('\n');

    for s in &info.structs {
        out.push_str(s);
        out.push_str("\n\n");
    }

    for e in &info.enums {
        out.push_str(e);
        out.push_str("\n\n");
    }

    out.push_str("library LibAppStorage {\n");
    out.push_str(
        "    bytes32 constant STORAGE_POSITION = keccak256(\"diamond.app.storage\");\n\n",
    );

    out.push_str("    struct AppStorage {\n");
    for var in storage_vars {
        out.push_str(&format!("        {} {};\n", var.type_str, var.name));
    }
    out.push_str("    }\n\n");

    out.push_str(
        "    function diamondStorage() internal pure returns (AppStorage storage ds) {\n",
    );
    out.push_str("        bytes32 position = STORAGE_POSITION;\n");
    out.push_str("        assembly {\n");
    out.push_str("            ds.slot := position\n");
    out.push_str("        }\n");
    out.push_str("    }\n");
    out.push_str("}\n");

    OutputFile {
        path: "contracts/libraries/LibAppStorage.sol".to_string(),
        content: out,
    }
}

// ---------------------------------------------------------------------------
// {Name}Facet.sol
// ---------------------------------------------------------------------------

fn gen_facet(info: &ContractInfo, storage_vars: &[&StateVar]) -> OutputFile {
    let facet_name = format!("{}Facet", info.name);

    let mut out = String::new();
    out.push_str(&info.license);
    out.push('\n');
    out.push_str(&pragma_line(info));
    out.push('\n');
    out.push_str("import {LibAppStorage} from \"../libraries/LibAppStorage.sol\";\n");
    out.push_str("import {LibDiamond} from \"../libraries/LibDiamond.sol\";\n\n");

    out.push_str(&format!("contract {facet_name} {{\n"));

    // Events and errors inside the contract body
    for evt in &info.events {
        out.push_str(&format!("    {};\n", evt.trim_end().trim_end_matches(';')));
    }
    for err in &info.errors {
        out.push_str(&format!("    {};\n", err.trim_end().trim_end_matches(';')));
    }

    for func in &info.functions {
        out.push('\n');
        write_facet_function(&mut out, func, storage_vars);
    }

    out.push_str("}\n");

    OutputFile {
        path: format!("contracts/facets/{facet_name}.sol"),
        content: out,
    }
}

fn write_facet_function(out: &mut String, func: &FunctionInfo, storage_vars: &[&StateVar]) {
    let vis = if func.visibility == "public" {
        "external"
    } else {
        &func.visibility
    };

    let mut sig = format!("    function {}({})", func.name, func.params_source);
    sig.push_str(&format!(" {vis}"));
    if let Some(ref m) = func.mutability {
        sig.push_str(&format!(" {m}"));
    }
    if !func.returns_source.is_empty() {
        sig.push_str(&format!(" returns ({})", func.returns_source));
    }
    out.push_str(&sig);
    out.push_str(" {\n");

    if func.has_owner_guard {
        out.push_str("        LibDiamond.enforceIsContractOwner();\n");
    }

    let rewritten = rewrite_state_refs(&func.body_source, storage_vars);
    let needs_storage = storage_vars
        .iter()
        .any(|v| rewritten.contains(&format!("s.{}", v.name)));

    if needs_storage {
        out.push_str(
            "        LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();\n",
        );
    }

    // Indent and write the body
    for line in rewritten.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        out.push_str(&format!("        {trimmed}\n"));
    }

    out.push_str("    }\n");
}

fn rewrite_state_refs(body: &str, storage_vars: &[&StateVar]) -> String {
    // Protect string literals from replacement by swapping them with placeholders
    let string_re = Regex::new(r#""[^"]*""#).unwrap();
    let mut strings: Vec<String> = Vec::new();
    let protected = string_re
        .replace_all(body, |caps: &regex::Captures| {
            let idx = strings.len();
            strings.push(caps[0].to_string());
            format!("__STR_{idx}__")
        })
        .to_string();

    let mut result = protected;
    for var in storage_vars {
        let pattern = format!(
            r"(^|[^.a-zA-Z0-9_])({})([^a-zA-Z0-9_(]|$)",
            regex::escape(&var.name)
        );
        let re = Regex::new(&pattern).unwrap();
        // Run twice to handle adjacent matches where the separator char is consumed
        for _ in 0..2 {
            result = re
                .replace_all(&result, |caps: &regex::Captures| {
                    format!("{}s.{}{}", &caps[1], &caps[2], &caps[3])
                })
                .to_string();
        }
    }

    // Restore string literals
    for (i, s) in strings.iter().enumerate() {
        result = result.replace(&format!("__STR_{i}__"), s);
    }

    result
}

// ---------------------------------------------------------------------------
// I{Name}Facet.sol — interface
// ---------------------------------------------------------------------------

fn gen_interface(info: &ContractInfo) -> OutputFile {
    let iface_name = format!("I{}Facet", info.name);

    let mut out = String::new();
    out.push_str(&info.license);
    out.push('\n');
    out.push_str(&pragma_line(info));
    out.push('\n');

    out.push_str(&format!("interface {iface_name} {{\n"));

    for func in &info.functions {
        if func.visibility == "internal" || func.visibility == "private" {
            continue;
        }
        let mut sig = format!("    function {}({})", func.name, func.params_source);
        sig.push_str(" external");
        if let Some(ref m) = func.mutability {
            sig.push_str(&format!(" {m}"));
        }
        if !func.returns_source.is_empty() {
            sig.push_str(&format!(" returns ({})", func.returns_source));
        }
        sig.push_str(";\n");
        out.push_str(&sig);
    }

    out.push_str("}\n");

    OutputFile {
        path: format!("contracts/interfaces/{iface_name}.sol"),
        content: out,
    }
}

// ---------------------------------------------------------------------------
// DiamondInit.sol
// ---------------------------------------------------------------------------

fn gen_diamond_init(info: &ContractInfo, storage_vars: &[&StateVar]) -> OutputFile {
    let mut out = String::new();
    out.push_str(&info.license);
    out.push('\n');
    out.push_str(&pragma_line(info));
    out.push('\n');
    out.push_str("import {LibDiamond} from \"../libraries/LibDiamond.sol\";\n");
    out.push_str("import {IDiamondLoupe} from \"../interfaces/IDiamondLoupe.sol\";\n");
    out.push_str("import {IDiamondCut} from \"../interfaces/IDiamondCut.sol\";\n");
    out.push_str("import {IERC173} from \"../interfaces/IERC173.sol\";\n");
    out.push_str("import {IERC165} from \"../interfaces/IERC165.sol\";\n");
    out.push_str("import {LibAppStorage} from \"../libraries/LibAppStorage.sol\";\n\n");
    out.push_str("contract DiamondInit {\n\n");

    let params = info
        .constructor
        .as_ref()
        .map(|c| c.params_source.clone())
        .unwrap_or_default();

    out.push_str(&format!("    function init({params}) external {{\n"));

    // ERC-165 interface registration
    out.push_str(
        "        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\n",
    );
    out.push_str("        ds.supportedInterfaces[type(IERC165).interfaceId] = true;\n");
    out.push_str("        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;\n");
    out.push_str("        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;\n");
    out.push_str("        ds.supportedInterfaces[type(IERC173).interfaceId] = true;\n\n");

    if !storage_vars.is_empty() {
        out.push_str(
            "        LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();\n",
        );
    }

    if let Some(ref ctor) = info.constructor {
        let rewritten = rewrite_state_refs(&ctor.body_source, storage_vars);
        for line in rewritten.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            out.push_str(&format!("        {trimmed}\n"));
        }
    }

    out.push_str("    }\n");
    out.push_str("}\n");

    OutputFile {
        path: "contracts/upgradeInitializers/DiamondInit.sol".to_string(),
        content: out,
    }
}

// ---------------------------------------------------------------------------
// Forge test
// ---------------------------------------------------------------------------

fn gen_test(info: &ContractInfo) -> OutputFile {
    let facet_name = format!("{}Facet", info.name);

    let mut out = String::new();
    out.push_str("// SPDX-License-Identifier: UNLICENSED\npragma solidity ^0.8.0;\n\n");
    out.push_str("import \"../contracts/interfaces/IDiamondCut.sol\";\n");
    out.push_str("import \"../contracts/facets/DiamondCutFacet.sol\";\n");
    out.push_str("import \"../contracts/facets/DiamondLoupeFacet.sol\";\n");
    out.push_str("import \"../contracts/facets/OwnershipFacet.sol\";\n");
    out.push_str(&format!(
        "import \"../contracts/facets/{facet_name}.sol\";\n"
    ));
    out.push_str("import \"../contracts/upgradeInitializers/DiamondInit.sol\";\n");
    out.push_str("import \"../contracts/Diamond.sol\";\n");
    out.push_str("import \"./helpers/DiamondUtils.sol\";\n\n");

    out.push_str(&format!(
        "contract {}Deployer is DiamondUtils, IDiamondCut {{\n",
        info.name
    ));
    out.push_str("    Diamond diamond;\n");
    out.push_str("    DiamondCutFacet dCutFacet;\n");
    out.push_str("    DiamondLoupeFacet dLoupe;\n");
    out.push_str("    OwnershipFacet ownerF;\n");
    out.push_str(&format!("    {facet_name} customFacet;\n"));
    out.push_str("    DiamondInit diamondInit;\n\n");

    out.push_str("    function testDeployDiamond() public {\n");
    out.push_str("        dCutFacet = new DiamondCutFacet();\n");
    out.push_str(
        "        diamond = new Diamond(address(this), address(dCutFacet));\n",
    );
    out.push_str("        dLoupe = new DiamondLoupeFacet();\n");
    out.push_str("        ownerF = new OwnershipFacet();\n");
    out.push_str(&format!("        customFacet = new {facet_name}();\n"));
    out.push_str("        diamondInit = new DiamondInit();\n\n");

    out.push_str("        FacetCut[] memory cut = new FacetCut[](3);\n\n");

    out.push_str("        cut[0] = FacetCut({\n");
    out.push_str("            facetAddress: address(dLoupe),\n");
    out.push_str("            action: FacetCutAction.Add,\n");
    out.push_str(
        "            functionSelectors: generateSelectors(\"DiamondLoupeFacet\")\n",
    );
    out.push_str("        });\n\n");

    out.push_str("        cut[1] = FacetCut({\n");
    out.push_str("            facetAddress: address(ownerF),\n");
    out.push_str("            action: FacetCutAction.Add,\n");
    out.push_str(
        "            functionSelectors: generateSelectors(\"OwnershipFacet\")\n",
    );
    out.push_str("        });\n\n");

    out.push_str("        cut[2] = FacetCut({\n");
    out.push_str("            facetAddress: address(customFacet),\n");
    out.push_str("            action: FacetCutAction.Add,\n");
    out.push_str(&format!(
        "            functionSelectors: generateSelectors(\"{facet_name}\")\n"
    ));
    out.push_str("        });\n\n");

    // Build init calldata
    let has_init_params = info
        .constructor
        .as_ref()
        .map(|c| !c.params_source.is_empty())
        .unwrap_or(false);

    if has_init_params {
        out.push_str("        // TODO: encode DiamondInit.init() arguments for your constructor parameters\n");
        out.push_str("        // bytes memory initCalldata = abi.encodeWithSelector(DiamondInit.init.selector, ...);\n");
        out.push_str("        // IDiamondCut(address(diamond)).diamondCut(cut, address(diamondInit), initCalldata);\n");
        out.push_str(
            "        IDiamondCut(address(diamond)).diamondCut(cut, address(0x0), \"\");\n",
        );
    } else {
        out.push_str("        IDiamondCut(address(diamond)).diamondCut(\n");
        out.push_str("            cut,\n");
        out.push_str("            address(diamondInit),\n");
        out.push_str(
            "            abi.encodeWithSelector(DiamondInit.init.selector)\n",
        );
        out.push_str("        );\n");
    }

    out.push_str("\n        DiamondLoupeFacet(address(diamond)).facetAddresses();\n");

    // Smoke-call each external function
    for func in &info.functions {
        if func.visibility == "internal" || func.visibility == "private" {
            continue;
        }
        out.push_str(&format!(
            "\n        // TODO: test {facet_name}.{}()\n",
            func.name
        ));
    }

    out.push_str("    }\n\n");

    out.push_str("    function diamondCut(\n");
    out.push_str("        FacetCut[] calldata _diamondCut,\n");
    out.push_str("        address _init,\n");
    out.push_str("        bytes calldata _calldata\n");
    out.push_str("    ) external override {}\n");
    out.push_str("}\n");

    OutputFile {
        path: format!("test/deploy{}.t.sol", info.name),
        content: out,
    }
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

fn gen_readme(info: &ContractInfo) -> OutputFile {
    let facet_name = format!("{}Facet", info.name);

    let content = format!(
        r#"# {name} — Diamond Standard Project

> Auto-generated from `{name}.sol` using `diamonds convert`.

## Project Structure

```
contracts/
├── Diamond.sol                        # EIP-2535 proxy
├── facets/
│   ├── DiamondCutFacet.sol           # Upgrade mechanism
│   ├── DiamondLoupeFacet.sol         # Introspection
│   ├── OwnershipFacet.sol            # ERC-173 ownership
│   └── {facet_name}.sol       # Your contract logic
├── interfaces/
│   ├── IDiamondCut.sol
│   ├── IDiamondLoupe.sol
│   ├── IERC165.sol
│   ├── IERC173.sol
│   └── I{facet_name}.sol     # Your facet interface
├── libraries/
│   ├── LibDiamond.sol                # Diamond protocol storage
│   └── LibAppStorage.sol             # Your application storage
└── upgradeInitializers/
    └── DiamondInit.sol               # One-time initializer
```

## How It Works

Your original contract's **state variables** have been moved into
`LibAppStorage.AppStorage` — a struct stored at a deterministic slot
(`keccak256("diamond.app.storage")`). Each facet reads and writes through
this shared storage via `LibAppStorage.diamondStorage()`.

**Functions** from your original contract live in `{facet_name}.sol`.
The `Diamond.sol` proxy routes calls to facets using `delegatecall`, so all
facets share the same storage context.

## Quick Start

```bash
forge install         # install dependencies (forge-std, etc.)
forge build           # compile all contracts
forge test            # run the test suite
```

## Upgrading

Add new facets or replace existing ones by calling `diamondCut()`:

```solidity
IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
cut[0] = IDiamondCut.FacetCut({{
    facetAddress: address(newFacet),
    action: IDiamondCut.FacetCutAction.Replace,
    functionSelectors: selectors
}});
IDiamondCut(diamond).diamondCut(cut, address(0), "");
```

## Resources

- [EIP-2535 Specification](https://eips.ethereum.org/EIPS/eip-2535)
- [Diamond Reference Implementation](https://github.com/mudgen/diamond-3-hardhat)
- [Nick Mudge's Diamond Blog](https://eip2535diamonds.substack.com/)
"#,
        name = info.name,
        facet_name = facet_name,
    );

    OutputFile {
        path: "README.md".to_string(),
        content,
    }
}
