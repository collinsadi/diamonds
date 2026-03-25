// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC721Errors} from "../interfaces/IERC721Errors.sol";
import {IERC721} from "../interfaces/IERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ERC721Facet is IERC721Errors {
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );

    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    function balanceOf(address owner) public view virtual returns (uint256) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(address(0));
        }
        return LibDiamond.diamondStorage().balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        return _requireOwned(tokenId);
    }

    function name() public view virtual returns (string memory) {
        return LibDiamond.diamondStorage().name;
    }

    function symbol() public view virtual returns (string memory) {
        return LibDiamond.diamondStorage().symbol;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();
        if (bytes(baseURI).length > 0) {
            return string.concat(baseURI, Strings.toString(tokenId));
        } else {
            return "";
        }
    }

    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    function approve(address to, uint256 tokenId) public virtual {
        address owner = _requireOwned(tokenId);
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender)) {
            revert ERC721InvalidApprover(msg.sender);
        }
        _approve(to, tokenId, owner);
    }

    function getApproved(
        uint256 tokenId
    ) public view virtual returns (address) {
        _requireOwned(tokenId);
        return LibDiamond.diamondStorage().tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view virtual returns (bool) {
        return LibDiamond.diamondStorage().operatorApprovals[owner][operator];
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, msg.sender);
        if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual {
        transferFrom(from, to, tokenId);
        _checkOnERC721Received(msg.sender, to, tokenId, data);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual returns (address) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        address from = ds.owners[tokenId];

        if (auth != address(0)) {
            _checkAuthorized(from, auth, tokenId);
        }

        if (from != address(0)) {
            _approve(address(0), tokenId, address(0));
            unchecked {
                ds.balances[from] -= 1;
            }
        }

        if (to != address(0)) {
            unchecked {
                ds.balances[to] += 1;
            }
        }

        ds.owners[tokenId] = to;
        emit Transfer(from, to, tokenId);

        return from;
    }

    function _mint(address to, uint256 tokenId) internal {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0));
        if (previousOwner != address(0)) {
            revert ERC721InvalidSender(address(0));
        }
    }

    function safeMint(address to, uint256 tokenId) external {
        LibDiamond.enforceIsContractOwner();
        _safeMint(to, tokenId, "");
    }

    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal virtual {
        _mint(to, tokenId);
        _checkOnERC721Received(address(0), to, tokenId, data);
    }

    function _burn(uint256 tokenId) internal {
        address previousOwner = _update(address(0), tokenId, address(0));
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0));
        if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function _safeTransfer(address from, address to, uint256 tokenId) internal {
        _safeTransfer(from, to, tokenId, "");
    }

    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal virtual {
        _transfer(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    function _approve(address to, uint256 tokenId, address auth) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.tokenApprovals[tokenId] = to;
        if (auth != address(0)) {
            address owner = ds.owners[tokenId];
            emit Approval(owner, to, tokenId);
        }
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        if (operator == address(0)) {
            revert ERC721InvalidOperator(operator);
        }
        LibDiamond.diamondStorage().operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _requireOwned(uint256 tokenId) internal view returns (address) {
        address owner = LibDiamond.diamondStorage().owners[tokenId];
        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
        return owner;
    }

    function _checkAuthorized(
        address owner,
        address spender,
        uint256 tokenId
    ) internal view {
        if (
            spender != owner &&
            !isApprovedForAll(owner, spender) &&
            LibDiamond.diamondStorage().tokenApprovals[tokenId] != spender
        ) {
            if (owner == address(0)) {
                revert ERC721NonexistentToken(tokenId);
            } else {
                revert ERC721InsufficientApproval(spender, tokenId);
            }
        }
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            try
                IERC721Receiver(to).onERC721Received(
                    msg.sender,
                    from,
                    tokenId,
                    data
                )
            returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) {
                    revert ERC721InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert ERC721InvalidReceiver(to);
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}
