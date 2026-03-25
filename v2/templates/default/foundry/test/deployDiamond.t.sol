// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/upgradeInitializers/DiamondInit.sol";
import "../contracts/Diamond.sol";

import "./helpers/DiamondUtils.sol";

contract DiamondDeployer is DiamondUtils {
    Diamond diamond;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;
    DiamondInit dInit;

    function setUp() public {
        dCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(dCutFacet));
        dLoupe = new DiamondLoupeFacet();
        ownerF = new OwnershipFacet();
        dInit = new DiamondInit();

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](2);

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(dLoupe),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: generateSelectors("DiamondLoupeFacet")
        });

        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(ownerF),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: generateSelectors("OwnershipFacet")
        });

        IDiamondCut(address(diamond)).diamondCut(
            cut,
            address(dInit),
            abi.encodeWithSignature("init()")
        );
    }

    function testFacetAddresses() public view {
        address[] memory addresses = DiamondLoupeFacet(address(diamond)).facetAddresses();
        assertEq(addresses.length, 3);
    }

    function testOwnership() public view {
        address owner = OwnershipFacet(address(diamond)).owner();
        assertEq(owner, address(this));
    }

    function testSupportsInterface() public view {
        // ERC-165
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x01ffc9a7));
        // IDiamondCut
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x1f931c1c));
        // IDiamondLoupe
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x48e2b093));
        // IERC173
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x7f5828d0));
    }
}
