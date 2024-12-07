const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DiamondDeployer", function () {
  async function deployDiamondFixture() {
    const [owner] = await ethers.getSigners();
    // deploy diamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    const diamondCutFacet = await DiamondCutFacet.deploy();

    //deploy Diamond
    const Diamond = await ethers.getContractFactory("Diamond");
    const diamond = await Diamond.deploy(
      owner.address,
      diamondCutFacet.address
    );

    // deploy diamondLoupeFacet
    const DiamondLoupeFacet = await ethers.getContractFactory(
      "DiamondLoupeFacet"
    );
    const diamondLoupeFacet = await DiamondLoupeFacet.deploy();

    //deploy ownershipFacet
    const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
    const ownershipFacet = await OwnershipFacet.deploy();

    //deploy ERC721Facet
    const ERC721Facet = await ethers.getContractFactory("ERC721Facet");
    const erc721Facet = await ERC721Facet.deploy();

    return {
      diamondCutFacet,
      diamond,
      diamondLoupeFacet,
      ownershipFacet,
      erc721Facet,
    };
  }

  describe("Deployment", function () {
    it("Should assign the right name to the NFT", async function () {
      const { diamond } = await loadFixture(deployDiamondFixture);
      await diamond.initialiseERC721Facet("NewNft", "NN");
      const name = await diamond.name();
      expect(name).to.equal("NewNft");
    });
  });
});
