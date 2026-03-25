# EIP-2535 Diamond Project (Hardhat)

An upgradeable smart contract project using the [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535).

## Quick Start

```shell
# Install dependencies
npm install

# Compile
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat run scripts/deploy.js
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
scripts/
├── deploy.js                     # Diamond deployment script
└── libraries/
    └── diamond.js                # Diamond helper utilities
test/
└── ERC721Facet.test.js           # Deployment and integration tests
```

## How It Works

The Diamond pattern splits contract logic across multiple "facets" that share a single storage and address. The `Diamond.sol` proxy delegates calls to the appropriate facet based on the function selector.

- **Add facets** with `diamondCut()` to extend functionality
- **Replace facets** to upgrade existing logic
- **Remove facets** to disable features
- **DiamondLoupe** lets anyone inspect which facets and functions are available

## Resources

- [EIP-2535 Specification](https://eips.ethereum.org/EIPS/eip-2535)
- [Hardhat Documentation](https://hardhat.org/docs)
