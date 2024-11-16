// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../contracts/facets/ERC20Facet.sol";
import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/Diamond.sol";

import "./helpers/DiamondUtils.sol";

contract DiamondDeployer is DiamondUtils, IDiamondCut {
    //contract types of facets to be deployed
    Diamond diamond;
    ERC20Facet erc20Facet;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;

    address owner = address(0x1234);
    address user1 = address(0x5678);
    address user2 = address(0x9ABC);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function setUp() public {
        //deploy facets
        // //
        dCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(dCutFacet));
        dLoupe = new DiamondLoupeFacet();
        ownerF = new OwnershipFacet();
        erc20Facet = new ERC20Facet();

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

        cut[2] = FacetCut({
            facetAddress: address(erc20Facet),
            action: FacetCutAction.Add,
            functionSelectors: generateSelectors("ERC20Facet")
        });

        // Initialize ERC20 data
        bytes memory initData = abi.encodeWithSelector(
            ERC20Facet.initialize.selector,
            "DiamondToken",
            "DTK",
            18
        );

        // upgrade Diamond with erc20facet
        IDiamondCut(address(diamond)).diamondCut(cut, address(erc20Facet), initData);
        
        //call a function
        DiamondLoupeFacet(address(diamond)).facetAddresses();

        // vm.stopPrank();
    }

    function testInitialization() public view {
        assertEq(ERC20Facet(address(diamond)).name(), "DiamondToken");
        assertEq(ERC20Facet(address(diamond)).symbol(), "DTK");
        assertEq(ERC20Facet(address(diamond)).decimals(), 18);
        assertEq(ERC20Facet(address(diamond)).totalSupply(), 0);
    }

    function testTransfer() public {
        uint256 amount = 100;
        
        // First mint some tokens to owner
        ERC20Facet(address(diamond)).mint(address(this), amount);
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), amount);

        // Transfer to user1
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(this), user1, amount);
        
        bool success = ERC20Facet(address(diamond)).transfer(user1, amount);
        assertTrue(success);
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), 0);
        assertEq(ERC20Facet(address(diamond)).balanceOf(user1), amount);
    }

    function testApproveAndTransferFrom() public {
        uint256 amount = 100;
        
        // Mint tokens to owner
        ERC20Facet(address(diamond)).mint(address(this), amount);
        
        // Approve user1 to spend tokens
        vm.expectEmit(true, true, false, true);
        emit Approval(address(this), user1, amount);
        
        bool success = ERC20Facet(address(diamond)).approve(user1, amount);
        assertTrue(success);
        assertEq(ERC20Facet(address(diamond)).allowance(address(this), user1), amount);

        // User1 transfers tokens from owner to user2
        vm.startPrank(user1);
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(this), user2, amount);
        
        success = ERC20Facet(address(diamond)).transferFrom(address(this), user2, amount);
        assertTrue(success);
        assertEq(ERC20Facet(address(diamond)).balanceOf(address(this)), 0);
        assertEq(ERC20Facet(address(diamond)).balanceOf(user2), amount);
        assertEq(ERC20Facet(address(diamond)).allowance(address(this), user1), 0);
        vm.stopPrank();
    }

    function testFailTransferInsufficientBalance() public {
        uint256 amount = 100;
        // vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC20InsufficientBalance.selector,
                owner,
                0,
                amount
            )
        );
        ERC20Facet(address(diamond)).transfer(user1, amount);
    }

    function testFailTransferFromInsufficientAllowance() public {
        uint256 amount = 100;
        //
        ERC20Facet(address(diamond)).mint(owner, amount);
        ERC20Facet(address(diamond)).approve(user1, amount - 1);
        // vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC20InsufficientAllowance.selector,
                user1,
                amount - 1,
                amount
            )
        );
        ERC20Facet(address(diamond)).transferFrom(owner, user2, amount);
    }

    function testBurn() public {
        uint256 amount = 100;
        //
        
        // Mint tokens to owner
        ERC20Facet(address(diamond)).mint(owner, amount);
        assertEq(ERC20Facet(address(diamond)).totalSupply(), amount);
        
        // Burn tokens
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, address(0), amount);
        
        ERC20Facet(address(diamond)).burn(owner, amount);
        assertEq(ERC20Facet(address(diamond)).balanceOf(owner), 0);
        assertEq(ERC20Facet(address(diamond)).totalSupply(), 0);
        vm.stopPrank();
    }

    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {}
}
