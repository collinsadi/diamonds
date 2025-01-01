// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/facets/ERC721Facet.sol";
import "../contracts/Diamond.sol";
import "./helpers/DiamondUtils.sol";

contract ERC721FacetTest is Test, DiamondUtils {
    Diamond diamond;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;
    ERC721Facet erc721Facet;
    
    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    uint256 tokenId = 1;

    function setUp() public {
        // Deploy facets
        dCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(dCutFacet));
        dLoupe = new DiamondLoupeFacet();
        ownerF = new OwnershipFacet();
        erc721Facet = new ERC721Facet();

        // Create facet cuts
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](3);
        cut[0] = (
            IDiamondCut.FacetCut({
                facetAddress: address(dLoupe),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: generateSelectors("DiamondLoupeFacet")
            })
        );
        cut[1] = (
            IDiamondCut.FacetCut({
                facetAddress: address(ownerF),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: generateSelectors("OwnershipFacet")
            })
        );
        cut[2] = (
            IDiamondCut.FacetCut({
                facetAddress: address(erc721Facet),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: generateSelectors("ERC721Facet")
            })
        );

        // Upgrade diamond
        IDiamondCut(address(diamond)).diamondCut(cut, address(0x0), "");
    }

    function testMint() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), user1);
        assertEq(ERC721Facet(address(diamond)).balanceOf(user1), 1);
    }

    function testTransfer() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        
        vm.prank(user1);
        ERC721Facet(address(diamond)).transferFrom(user1, user2, tokenId);
        
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), user2);
        assertEq(ERC721Facet(address(diamond)).balanceOf(user1), 0);
        assertEq(ERC721Facet(address(diamond)).balanceOf(user2), 1);
    }

    function testSafeTransfer() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        
        vm.prank(user1);
        ERC721Facet(address(diamond)).safeTransferFrom(user1, user2, tokenId);
        
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), user2);
    }

    function testApproval() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        
        vm.prank(user1);
        ERC721Facet(address(diamond)).approve(user2, tokenId);
        
        assertEq(ERC721Facet(address(diamond)).getApproved(tokenId), user2);
        
        vm.prank(user2);
        ERC721Facet(address(diamond)).transferFrom(user1, address(0x3), tokenId);
        
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), address(0x3));
    }

    function testApprovalForAll() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        uint256 tokenId2 = 2;
        ERC721Facet(address(diamond)).safeMint(user1, tokenId2);
        
        vm.prank(user1);
        ERC721Facet(address(diamond)).setApprovalForAll(user2, true);
        
        assertTrue(ERC721Facet(address(diamond)).isApprovedForAll(user1, user2));
        
        vm.prank(user2);
        ERC721Facet(address(diamond)).transferFrom(user1, address(0x3), tokenId);
        
        vm.prank(user2);
        ERC721Facet(address(diamond)).transferFrom(user1, address(0x3), tokenId2);
    }

    function testFailTransferFromUnowned() public {
        vm.expectRevert("ERC721: invalid token ID");
        vm.prank(user1);
        ERC721Facet(address(diamond)).transferFrom(user1, user2, tokenId);
    }

    function testFailTransferNotApproved() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        
        vm.expectRevert("ERC721InvalidApprover");
        vm.prank(user2);
        ERC721Facet(address(diamond)).transferFrom(user1, user2, tokenId);
    }

    function testFailMintDuplicate() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        
        vm.expectRevert("ERC721InvalidSender");
        ERC721Facet(address(diamond)).safeMint(user2, tokenId);
    }

    function testTokenURI() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        string memory uri = ERC721Facet(address(diamond)).tokenURI(tokenId);
        assertEq(uri, "");  // Default implementation returns empty string
    }
}