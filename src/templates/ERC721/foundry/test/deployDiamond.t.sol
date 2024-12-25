// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";

import "../contracts/facets/ERC721Facet.sol";
import "../contracts/Diamond.sol";

import "./helpers/DiamondUtils.sol";


contract DiamondDeployer is DiamondUtils, IDiamondCut {
    //contract types of facets to be deployed
    Diamond diamond;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;
    ERC721Facet erc721Facet;


    function testDeployDiamond() public {
        //deploy facets
        dCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(dCutFacet));
        dLoupe = new DiamondLoupeFacet();
        ownerF = new OwnershipFacet();
        erc721Facet = new ERC721Facet();
       

        //upgrade diamond with facets

        //build cut struct
        FacetCut[] memory cut = new FacetCut[](3);

        cut[0] = (
            FacetCut({
                facetAddress: address(dLoupe),
                action: FacetCutAction.Add,
                functionSelectors: generateSelectors("DiamondLoupeFacet")
            })
        );

        cut[1] = (
            FacetCut({
                facetAddress: address(ownerF),
                action: FacetCutAction.Add,
                functionSelectors: generateSelectors("OwnershipFacet")
            })
        );

        cut[2] = (
            FacetCut({
                facetAddress: address(erc721Facet),
                action: FacetCutAction.Add,
                functionSelectors: generateSelectors("ERC721Facet")
            })
        );



        //upgrade diamond
        IDiamondCut(address(diamond)).diamondCut(cut, address(0x0), "");

        //call a function
        DiamondLoupeFacet(address(diamond)).facetAddresses();
        
        
        string memory name = "Test Token";
        string memory symbol = "TST";
        uint8 decimals = 18;
        uint256 initialSupply = 1000000 * 10**uint256(decimals);

        // Check name
        assertEq(ERC20Facet(address(diamond)).name(), name);

        // Check symbol
        assertEq(ERC20Facet(address(diamond)).symbol(), symbol);

        // Check decimals
        assertEq(ERC20Facet(address(diamond)).decimals(), decimals);

        // Check total supply
        assertEq(ERC20Facet(address(diamond)).totalSupply(), 0);  // Initially, total supply should be 0

        // Check initial balance
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), 0);  // Initially, balance should be 0

        // Mint initial supply to this contract
        vm.prank(address(this));
        ERC20Facet(address(diamond)).mint(address(this), initialSupply);

        // Check updated total supply
        assertEq(ERC20Facet(address(diamond)).totalSupply(), initialSupply);

        // Check updated balance
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), initialSupply);

        // Test transfer
        address recipient = address(0x123);
        uint256 transferAmount = 1000 * 10**uint256(decimals);
        assertTrue(ERC20Facet(address(diamond)).transfer(recipient, transferAmount), "Transfer failed");
        assertEq(ERC20Facet(address(diamond)).balanceOf(recipient), transferAmount, "Incorrect recipient balance after transfer");
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), initialSupply - transferAmount, "Incorrect sender balance after transfer");

        // Test approve and transferFrom
        address spender = address(0x456);
        uint256 approvalAmount = 500 * 10**uint256(decimals);
        assertTrue(ERC20Facet(address(diamond)).approve(spender, approvalAmount), "Approval failed");
        assertEq(ERC20Facet(address(diamond)).allowance(address(this), spender), approvalAmount, "Incorrect allowance after approval");

        uint256 transferFromAmount = 250 * 10**uint256(decimals);
        vm.prank(spender);
        assertTrue(ERC20Facet(address(diamond)).transferFrom(address(this), recipient, transferFromAmount), "TransferFrom failed");
        assertEq(ERC20Facet(address(diamond)).balanceOf(recipient), transferAmount + transferFromAmount, "Incorrect recipient balance after transferFrom");
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), initialSupply - transferAmount - transferFromAmount, "Incorrect sender balance after transferFrom");
        assertEq(ERC20Facet(address(diamond)).allowance(address(this), spender), approvalAmount - transferFromAmount, "Incorrect allowance after transferFrom");

    }


    


    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {}


}
