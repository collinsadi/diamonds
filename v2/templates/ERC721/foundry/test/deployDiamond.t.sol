// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/facets/ERC721Facet.sol";
import "../contracts/upgradeInitializers/DiamondInit.sol";
import "../contracts/interfaces/IERC721Errors.sol";
import "../contracts/Diamond.sol";
import "./helpers/DiamondUtils.sol";

contract ERC721FacetTest is Test, DiamondUtils {
    Diamond diamond;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;
    ERC721Facet erc721Facet;
    DiamondInit dInit;

    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    uint256 tokenId = 1;

    function setUp() public {
        dCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(dCutFacet));
        dLoupe = new DiamondLoupeFacet();
        ownerF = new OwnershipFacet();
        erc721Facet = new ERC721Facet();
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
            facetAddress: address(erc721Facet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: generateSelectors("ERC721Facet")
        });

        IDiamondCut(address(diamond)).diamondCut(
            cut,
            address(dInit),
            abi.encodeWithSignature("init(string,string)", "Test NFT", "TNFT")
        );
    }

    function testMetadata() public view {
        assertEq(ERC721Facet(address(diamond)).name(), "Test NFT");
        assertEq(ERC721Facet(address(diamond)).symbol(), "TNFT");
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

    function testRevertTransferNonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, tokenId));
        vm.prank(user1);
        ERC721Facet(address(diamond)).transferFrom(user1, user2, tokenId);
    }

    function testRevertTransferNotApproved() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);

        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721InsufficientApproval.selector, user2, tokenId));
        vm.prank(user2);
        ERC721Facet(address(diamond)).transferFrom(user1, user2, tokenId);
    }

    function testRevertMintDuplicate() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);

        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721InvalidSender.selector, address(0)));
        ERC721Facet(address(diamond)).safeMint(user2, tokenId);
    }

    function testRevertApproveNotOwner() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);

        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721InvalidApprover.selector, user2));
        vm.prank(user2);
        ERC721Facet(address(diamond)).approve(address(0x3), tokenId);
    }

    function testRevertMintNotOwner() public {
        vm.expectRevert();
        vm.prank(user1);
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
    }

    function testSupportsInterface() public view {
        // ERC-165
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x01ffc9a7));
        // IERC721 (0x80ac58cd)
        assertTrue(DiamondLoupeFacet(address(diamond)).supportsInterface(0x80ac58cd));
    }

    function testTokenURI() public {
        ERC721Facet(address(diamond)).safeMint(user1, tokenId);
        string memory uri = ERC721Facet(address(diamond)).tokenURI(tokenId);
        assertEq(uri, "");
    }
}
