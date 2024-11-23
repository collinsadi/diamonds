import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { getSelectors, FacetCutAction } from "./helpers/diamond";
import { Contract } from "ethers";

describe("ERC20Facet", function () {
  const TOKEN_NAME = "DiamondToken";
  const TOKEN_SYMBOL = "DTK";
  const TOKEN_DECIMALS = 18;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  async function deployDiamondFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    const diamondCutFacet = await DiamondCutFacet.deploy();

    // Deploy Diamond
    const Diamond = await ethers.getContractFactory("Diamond");
    const diamond = await Diamond.deploy(owner.address, diamondCutFacet);

    // Deploy DiamondLoupeFacet
    const DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
    const diamondLoupeFacet = await DiamondLoupeFacet.deploy();

    // Deploy OwnershipFacet
    const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
    const ownershipFacet = await OwnershipFacet.deploy();

    // Deploy ERC20Facet
    const ERC20Facet = await ethers.getContractFactory("ERC20Facet");
    const erc20Facet = await ERC20Facet.deploy();

    // Build cut struct
    const cut = [
      {
        facetAddress: diamondLoupeFacet.target,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(diamondLoupeFacet)
      },
      {
        facetAddress: ownershipFacet.target,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(ownershipFacet)
      },
      {
        facetAddress: erc20Facet.target,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(erc20Facet)
      }
    ];

    // Make the cut
    const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.target);
    const tx = await diamondCut.diamondCut(cut, ethers.ZeroAddress, "0x");
    await tx.wait();

    // Get facet for testing
    const erc20Token = await ethers.getContractAt("ERC20Facet", diamond.target);
    
    // Initialize the ERC20 token
    await erc20Token.initialize(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS);
    
    return { 
      diamond, 
      erc20Token,
      diamondCutFacet, 
      diamondLoupeFacet, 
      ownershipFacet, 
      erc20Facet, 
      owner, 
      addr1, 
      addr2 
    };
  }

  describe("Deployment & Initialization", function () {
    it("Should initialize with correct name, symbol and decimals", async function () {
      const { erc20Token } = await loadFixture(deployDiamondFixture);
      
      expect(await erc20Token.name()).to.equal(TOKEN_NAME);
      expect(await erc20Token.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await erc20Token.decimals()).to.equal(TOKEN_DECIMALS);
    });

    it("Should start with zero total supply", async function () {
      const { erc20Token } = await loadFixture(deployDiamondFixture);
      expect(await erc20Token.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to account", async function () {
      const { erc20Token, addr1 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(addr1.address, amount);
      expect(await erc20Token.balanceOf(addr1.address)).to.equal(amount);
      expect(await erc20Token.totalSupply()).to.equal(amount);
    });

    it("Should emit Transfer event on mint", async function () {
      const { erc20Token, addr1 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await expect(erc20Token.mint(addr1.address, amount))
        .to.emit(erc20Token, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, amount);
    });

    it("Should revert when minting to zero address", async function () {
      const { erc20Token } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await expect(erc20Token.mint(ethers.ZeroAddress, amount))
        .to.be.revertedWithCustomError(erc20Token, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("Burning", function () {
    it("Should burn tokens from account", async function () {
      const { erc20Token, addr1 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(addr1.address, amount);
      await erc20Token.burn(addr1.address, amount);
      
      expect(await erc20Token.balanceOf(addr1.address)).to.equal(0);
      expect(await erc20Token.totalSupply()).to.equal(0);
    });

    it("Should emit Transfer event on burn", async function () {
      const { erc20Token, addr1 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(addr1.address, amount);
      await expect(erc20Token.burn(addr1.address, amount))
        .to.emit(erc20Token, "Transfer")
        .withArgs(addr1.address, ethers.ZeroAddress, amount);
    });

    it("Should revert when burning from zero address", async function () {
      const { erc20Token } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await expect(erc20Token.burn(ethers.ZeroAddress, amount))
        .to.be.revertedWithCustomError(erc20Token, "ERC20InvalidSender")
        .withArgs(ethers.ZeroAddress);
    });

    it("Should revert when burning more than balance", async function () {
      const { erc20Token, addr1 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(addr1.address, amount);
      await expect(erc20Token.burn(addr1.address, ethers.parseEther("200")))
        .to.be.revertedWithCustomError(erc20Token, "ERC20InsufficientBalance");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { erc20Token, addr1, addr2 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(addr1.address, amount);
      await erc20Token.connect(addr1).transfer(addr2.address, amount);

      expect(await erc20Token.balanceOf(addr1.address)).to.equal(0);
      expect(await erc20Token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should emit Transfer event", async function () {
      const { erc20Token, addr1, addr2 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(addr1.address, amount);
      await expect(erc20Token.connect(addr1).transfer(addr2.address, amount))
        .to.emit(erc20Token, "Transfer")
        .withArgs(addr1.address, addr2.address, amount);
    });

    it("Should revert if sender doesn't have enough tokens", async function () {
      const { erc20Token, addr1, addr2 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await expect(erc20Token.connect(addr1).transfer(addr2.address, amount))
        .to.be.revertedWithCustomError(erc20Token, "ERC20InsufficientBalance");
    });
  });

  describe("Allowances", function () {
    it("Should approve spending", async function () {
      const { erc20Token, owner, addr1 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.connect(owner).approve(addr1.address, amount);
      expect(await erc20Token.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Should emit Approval event", async function () {
      const { erc20Token, owner, addr1 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await expect(erc20Token.connect(owner).approve(addr1.address, amount))
        .to.emit(erc20Token, "Approval")
        .withArgs(owner.address, addr1.address, amount);
    });

    it("Should allow transferFrom when approved", async function () {
      const { erc20Token, owner, addr1, addr2 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(owner.address, amount);
      await erc20Token.approve(addr1.address, amount);
      await erc20Token.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      expect(await erc20Token.balanceOf(addr2.address)).to.equal(amount);
      expect(await erc20Token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should revert transferFrom if not enough allowance", async function () {
      const { erc20Token, owner, addr1, addr2 } = await loadFixture(deployDiamondFixture);
      const amount = ethers.parseEther("100");

      await erc20Token.mint(owner.address, amount);
      await erc20Token.approve(addr1.address, ethers.parseEther("50"));

      await expect(erc20Token.connect(addr1).transferFrom(owner.address, addr2.address, amount))
        .to.be.revertedWithCustomError(erc20Token, "ERC20InsufficientAllowance");
    });
  });
});