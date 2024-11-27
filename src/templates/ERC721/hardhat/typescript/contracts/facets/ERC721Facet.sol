// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC721/ERC721.sol)

pragma solidity ^0.8.0;

import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {ERC721Utils} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

/**
 * @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC-721] Non-Fungible Token Standard, including
 * the Metadata extension, but not including the Enumerable extension, which is available separately as
 * {ERC721Enumerable}.
 */
contract ERC721Facet is IERC721, ERC165, IERC721Metadata, IERC721Errors {
    using Strings for uint256;

    function initialiseERC721Facet(
        string memory _name,
        string memory _symbol
    ) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (msg.sender != ds.contractOwner) revert LibDiamond.NotDiamondOwner();

        ds.name = _name;
        ds.symbol = _symbol;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner) public view returns (uint256) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(address(0));
        }

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        return ds.balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return _requireOwned(tokenId);
    }

    function name() public view returns (string memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        return ds.name;
    }

    function symbol() public view returns (string memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        return ds.symbol;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string.concat(baseURI, tokenId.toString())
                : "";
    }

    function _baseURI() internal pure returns (string memory) {
        return "";
    }

    function approve(address to, uint256 tokenId) public {
        _approve(to, tokenId, msg.sender);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        _requireOwned(tokenId);

        return _getApproved(tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public {
        _setApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        return ds.operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
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
        ERC721Utils.checkOnERC721Received(msg.sender, from, to, tokenId, data);
    }

    function _ownerOf(uint256 tokenId) internal view returns (address) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        return ds.owners[tokenId];
    }

    function _getApproved(
        uint256 tokenId
    ) internal view virtual returns (address) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        return ds.tokenApprovals[tokenId];
    }

    function _isAuthorized(
        address owner,
        address spender,
        uint256 tokenId
    ) internal view virtual returns (bool) {
        return
            spender != address(0) &&
            (owner == spender ||
                isApprovedForAll(owner, spender) ||
                _getApproved(tokenId) == spender);
    }

    function _checkAuthorized(
        address owner,
        address spender,
        uint256 tokenId
    ) internal view virtual {
        if (!_isAuthorized(owner, spender, tokenId)) {
            if (owner == address(0)) {
                revert ERC721NonexistentToken(tokenId);
            } else {
                revert ERC721InsufficientApproval(spender, tokenId);
            }
        }
    }

    function _increaseBalance(address account, uint128 value) internal virtual {
        unchecked {
            LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

            ds.balances[account] += value;
        }
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal returns (address) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        address from = _ownerOf(tokenId);

        // Perform (optional) operator check
        if (auth != address(0)) {
            _checkAuthorized(from, auth, tokenId);
        }

        // Execute the update
        if (from != address(0)) {
            // Clear approval. No need to re-authorize or emit the Approval event
            _approve(address(0), tokenId, address(0), false);

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
        _safeMint(to, tokenId, "");
    }

    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        _mint(to, tokenId);
        ERC721Utils.checkOnERC721Received(
            msg.sender,
            address(0),
            to,
            tokenId,
            data
        );
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
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        } else if (previousOwner != from) {
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
        ERC721Utils.checkOnERC721Received(msg.sender, from, to, tokenId, data);
    }

    function _approve(address to, uint256 tokenId, address auth) internal {
        _approve(to, tokenId, auth, true);
    }

    function _approve(
        address to,
        uint256 tokenId,
        address auth,
        bool emitEvent
    ) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Avoid reading the owner unless necessary
        if (emitEvent || auth != address(0)) {
            address owner = _requireOwned(tokenId);

            // We do not use _isAuthorized because single-token approvals should not be able to call approve
            if (
                auth != address(0) &&
                owner != auth &&
                !isApprovedForAll(owner, auth)
            ) {
                revert ERC721InvalidApprover(auth);
            }

            if (emitEvent) {
                emit Approval(owner, to, tokenId);
            }
        }

        ds.tokenApprovals[tokenId] = to;
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (operator == address(0)) {
            revert ERC721InvalidOperator(operator);
        }

        ds.operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _requireOwned(uint256 tokenId) internal view returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
        return owner;
    }
}
