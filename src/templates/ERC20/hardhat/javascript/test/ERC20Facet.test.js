const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("DiamondDeployer", function () {
  async function deployDiamondFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
      // deploy diamondCutFacet
      const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
      const diamondCutFacet = await DiamondCutFacet.deploy();

      //deploy Diamond
      const Diamond = await ethers.getContractFactory("Diamond");
      const diamond = await Diamond.deploy(owner.address, diamondCutFacet.address);

      // deploy diamondLoupeFacet
      const DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
      const diamondLoupeFacet = await DiamondLoupeFacet.deploy();

      //deploy ownershipFacet
      const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
      const ownershipFacet = await OwnershipFacet.deploy();

      //deploy ERC20Facet
      const ERC20Facet = await ethers.getContractFactory("ERC20Facet");
      const erc20Facet = await ERC20Facet.deploy();
      
      return { diamondCutFacet, diamond, diamondLoupeFacet, ownershipFacet, erc20Facet, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should assign the total supply of tokens to the owner", async function () {
      const { diamond, owner } = await loadFixture(deployDiamondFixture);
      const totalSupply = await diamond.totalSupply();
      expect(await diamond.balanceOf(owner.address)).to.equal(totalSupply);
    });
  });
  
});

