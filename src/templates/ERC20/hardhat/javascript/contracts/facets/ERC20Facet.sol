// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

error ERC20InsufficientBalance(address from, uint256 balance, uint256 needed);
error ERC20InvalidSender(address from);
error ERC20InvalidReceiver(address receiver);
error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

/**
 * @title ERC20Facet
 * @dev Implementation of the ERC20 token standard for Diamond contracts
 */
contract ERC20Facet is IERC20, IERC20Metadata {
    function initialize(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) external {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.name = name_;
        ds.symbol = symbol_;
        ds.decimals = decimals_;
    }

    function name() public view override returns (string memory) {
        return LibDiamond.diamondStorage().name;
    }

    function symbol() public view override returns (string memory) {
        return LibDiamond.diamondStorage().symbol;
    }

    function decimals() public view override returns (uint8) {
        return LibDiamond.diamondStorage().decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return LibDiamond.diamondStorage().totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return LibDiamond.diamondStorage().balances[account];
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return LibDiamond.diamondStorage().allowances[owner][spender];
    }

    function mint(address from, uint256 amount) public returns (bool) {
        _mint(from, amount);
        return true;
    }

    function burn(address from, uint256 amount) public returns (bool) {
        _burn(from, amount);
        return true;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        address from = msg.sender;
        _transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(from);
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(to);
        }

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 fromBalance = ds.balances[from];
        if (fromBalance < amount) {
            revert ERC20InsufficientBalance(from, fromBalance, amount);
        }

        unchecked {
            ds.balances[from] = fromBalance - amount;
            ds.balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(account);
        }

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.totalSupply += amount;
        unchecked {
            ds.balances[account] += amount;
        }

        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(account);
        }

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 accountBalance = ds.balances[account];
        if (accountBalance < amount) {
            revert ERC20InsufficientBalance(account, accountBalance, amount);
        }

        unchecked {
            ds.balances[account] = accountBalance - amount;
            ds.totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        if (owner == address(0)) {
            revert ERC20InvalidSender(owner);
        }
        if (spender == address(0)) {
            revert ERC20InvalidReceiver(spender);
        }

        LibDiamond.diamondStorage().allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < amount) {
            revert ERC20InsufficientAllowance(spender, currentAllowance, amount);
        }
        unchecked {
            _approve(owner, spender, currentAllowance - amount);
        }
    }
}