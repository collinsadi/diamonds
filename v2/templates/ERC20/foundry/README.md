# EIP-2535 Diamond Project (Foundry)

An upgradeable smart contract project using the [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535).

## Quick Start

```shell
# Install dependencies
forge install

# Build
forge build

# Run tests (requires FFI enabled)
forge test -vvv

# Format
forge fmt
```

## Project Structure

```
contracts/
├── Diamond.sol                    # Main diamond proxy
├── facets/
│   ├── DiamondCutFacet.sol       # Manages adding/replacing/removing facets
│   ├── DiamondLoupeFacet.sol     # Introspection (which facets/functions exist)
│   └── OwnershipFacet.sol        # Ownership management (ERC-173)
├── interfaces/                    # Interface definitions
├── libraries/
│   └── LibDiamond.sol            # Core diamond storage and logic
└── upgradeInitializers/
    └── DiamondInit.sol           # Initialization logic for diamond cuts
test/
└── deployDiamond.t.sol           # Deployment and integration tests
```

## How It Works

The Diamond pattern splits contract logic across multiple "facets" that share a single storage and address. The `Diamond.sol` proxy delegates calls to the appropriate facet based on the function selector.

- **Add facets** with `diamondCut()` to extend functionality
- **Replace facets** to upgrade existing logic
- **Remove facets** to disable features
- **DiamondLoupe** lets anyone inspect which facets and functions are available

## Resources

- [EIP-2535 Specification](https://eips.ethereum.org/EIPS/eip-2535)
- [Foundry Documentation](https://book.getfoundry.sh/)
