// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/facets/ERC20Facet.sol";
import "../contracts/upgradeInitializers/DiamondInit.sol";
import "../contracts/Diamond.sol";

import "./helpers/DiamondUtils.sol";

contract DiamondDeployer is DiamondUtils {
    Diamond diamond;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;
    ERC20Facet erc20Facet;
    DiamondInit dInit;

    string constant NAME = "Test Token";
    string constant SYMBOL = "TST";
    uint8 constant DECIMALS = 18;

    function setUp() public {
        dCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(dCutFacet));
        dLoupe = new DiamondLoupeFacet();
        ownerF = new OwnershipFacet();
        erc20Facet = new ERC20Facet();
        dInit = new DiamondInit();

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](3);

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

        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(erc20Facet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: generateSelectors("ERC20Facet")
        });

        IDiamondCut(address(diamond)).diamondCut(
            cut,
            address(dInit),
            abi.encodeWithSignature("init(string,string,uint8)", NAME, SYMBOL, DECIMALS)
        );
    }

    function testTokenMetadata() public view {
        assertEq(ERC20Facet(address(diamond)).name(), NAME);
        assertEq(ERC20Facet(address(diamond)).symbol(), SYMBOL);
        assertEq(ERC20Facet(address(diamond)).decimals(), DECIMALS);
        assertEq(ERC20Facet(address(diamond)).totalSupply(), 0);
    }

    function testMintAndBalance() public {
        uint256 amount = 1000e18;
        ERC20Facet(address(diamond)).mint(address(this), amount);
        assertEq(ERC20Facet(address(diamond)).totalSupply(), amount);
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), amount);
    }

    function testTransfer() public {
        uint256 amount = 1000e18;
        address recipient = address(0x123);

        ERC20Facet(address(diamond)).mint(address(this), amount);
        assertTrue(ERC20Facet(address(diamond)).transfer(recipient, 100e18));
        assertEq(ERC20Facet(address(diamond)).balanceOf(recipient), 100e18);
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), 900e18);
    }

    function testApproveAndTransferFrom() public {
        uint256 amount = 1000e18;
        address spender = address(0x456);
        address recipient = address(0x789);

        ERC20Facet(address(diamond)).mint(address(this), amount);
        assertTrue(ERC20Facet(address(diamond)).approve(spender, 500e18));
        assertEq(ERC20Facet(address(diamond)).allowance(address(this), spender), 500e18);

        vm.prank(spender);
        assertTrue(ERC20Facet(address(diamond)).transferFrom(address(this), recipient, 250e18));
        assertEq(ERC20Facet(address(diamond)).balanceOf(recipient), 250e18);
        assertEq(ERC20Facet(address(diamond)).allowance(address(this), spender), 250e18);
    }

    function testSupportsInterface() public view {
        // ERC-165
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x01ffc9a7));
        // IERC20 (0x36372b07)
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x36372b07));
    }
}
