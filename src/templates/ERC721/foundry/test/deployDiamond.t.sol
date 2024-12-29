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
        uint256 tokenId = 1;
        
        // Check name
        assertEq(ERC721Facet(address(diamond)).name(), name);
        
        // Check symbol
        assertEq(ERC721Facet(address(diamond)).symbol(), symbol);
        
        // Check initial balance
        assertEq(ERC721Facet(address(diamond)).balanceOf(address(this)), 0);  // Initially, balance should be 0
        
        // Mint a token to this contract
        vm.prank(address(this));
        ERC721Facet(address(diamond)).safeMint(address(this), tokenId);
        
        // Check updated balance
        assertEq(ERC721Facet(address(diamond)).balanceOf(address(this)), 1);
        
        // Check owner of the token
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), address(this));
        
        // Test transfer
        address recipient = address(0x123);
        vm.prank(address(this));
        ERC721Facet(address(diamond)).transferFrom(address(this), recipient, tokenId);
        assertEq(ERC721Facet(address(diamond)).balanceOf(recipient), 1, "Incorrect recipient balance after transfer");
        assertEq(ERC721Facet(address(diamond)).balanceOf(address(this)), 0, "Incorrect sender balance after transfer");
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), recipient, "Incorrect owner after transfer");
        
        // Test approve and transferFrom
        address spender = address(0x456);
        vm.prank(recipient);
        ERC721Facet(address(diamond)).approve(spender, tokenId);
        assertEq(ERC721Facet(address(diamond)).getApproved(tokenId), spender, "Incorrect approval");
        
        vm.prank(spender);
        ERC721Facet(address(diamond)).transferFrom(recipient, address(this), tokenId);
        assertEq(ERC721Facet(address(diamond)).balanceOf(address(this)), 1, "Incorrect recipient balance after transferFrom");
        assertEq(ERC721Facet(address(diamond)).balanceOf(recipient), 0, "Incorrect sender balance after transferFrom");
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), address(this), "Incorrect owner after transferFrom");

    }


    


    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {}


}
