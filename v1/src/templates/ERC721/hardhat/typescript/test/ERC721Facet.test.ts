/* global describe, it, before */

import { ethers } from 'hardhat';
import { expect, assert } from 'chai';
import {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets,
} from '../scripts/libraries/diamond';
import { deployDiamond } from '../scripts/deploy';

describe('DiamondTest', async function () {
  let diamondAddress: string;
  let diamondCutFacet: any;
  let diamondLoupeFacet: any;
  let ownershipFacet: any;
  let erc721Facet: any;
  let tx: any;
  let receipt: any;
  let result: any;
  let accounts: any[];
  const addresses: string[] = [];

  before(async function () {
    // Get all signers
    accounts = await ethers.getSigners();

    diamondAddress = await deployDiamond();

    // Get the contract factories
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
    const DiamondLoupeFacet = await ethers.getContractFactory('DiamondLoupeFacet');
    const OwnershipFacet = await ethers.getContractFactory('OwnershipFacet');
    const ERC721Facet = await ethers.getContractFactory('ERC721Facet');

    // Attach the contracts to the diamond address
    diamondCutFacet = DiamondCutFacet.attach(diamondAddress);
    diamondLoupeFacet = DiamondLoupeFacet.attach(diamondAddress);
    ownershipFacet = OwnershipFacet.attach(diamondAddress);
    erc721Facet = ERC721Facet.attach(diamondAddress);
  });

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 4);
  });

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(diamondCutFacet).raw();
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.deepEqual(
      result.map((s: string) => s.toLowerCase()),
      selectors.map((s: string) => s.toLowerCase())
    );

    selectors = getSelectors(diamondLoupeFacet).raw();
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.deepEqual(
      result.map((s: string) => s.toLowerCase()),
      selectors.map((s: string) => s.toLowerCase())
    );

    selectors = getSelectors(ownershipFacet).raw();
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.deepEqual(
      result.map((s: string) => s.toLowerCase()),
      selectors.map((s: string) => s.toLowerCase())
    );
  });

  it('facets should have the right function selectors for ERC721Facet', async () => {
    const selectors = getSelectors(erc721Facet).raw();
    const result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3]);
    assert.deepEqual(
      result.map((s: string) => s.toLowerCase()),
      selectors.map((s: string) => s.toLowerCase())
    );
  });

  it('selectors should be associated with facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(addresses[0], await diamondLoupeFacet.facetAddress('0x1f931c1c'));
    assert.equal(addresses[1], await diamondLoupeFacet.facetAddress('0xcdffacc6'));
    assert.equal(addresses[2], await diamondLoupeFacet.facetAddress('0xf2fde38b'));
    assert.equal(addresses[3], await diamondLoupeFacet.facetAddress('0x6352211e'));
  });

  it('should mint a token correctly', async () => {
    const tokenId = 1;
    await erc721Facet.safeMint(accounts[1].address, tokenId);
    assert.equal(await erc721Facet.ownerOf(tokenId), accounts[1].address);
  });

  it('should transfer token correctly', async () => {
    const tokenId = 2;
    await erc721Facet.safeMint(accounts[1].address, tokenId);
    await erc721Facet
      .connect(accounts[1])
      .transferFrom(accounts[1].address, accounts[2].address, tokenId);
    assert.equal(await erc721Facet.ownerOf(tokenId), accounts[2].address);
  });

  it('should get correct token balance', async () => {
    const tokenId = 3;
    await erc721Facet.safeMint(accounts[1].address, tokenId);
    assert.equal(await erc721Facet.balanceOf(accounts[1].address), 2);
  });

  it('should approve and transfer token correctly', async () => {
    const tokenId = 4;
    await erc721Facet.safeMint(accounts[1].address, tokenId);
    await erc721Facet.connect(accounts[1]).approve(accounts[2].address, tokenId);
    assert.equal(await erc721Facet.getApproved(tokenId), accounts[2].address);

    await erc721Facet
      .connect(accounts[2])
      .transferFrom(accounts[1].address, accounts[3].address, tokenId);
    assert.equal(await erc721Facet.ownerOf(tokenId), accounts[3].address);
  });

  it('should set and check approval for all', async () => {
    await erc721Facet.connect(accounts[1]).setApprovalForAll(accounts[2].address, true);
    assert.equal(await erc721Facet.isApprovedForAll(accounts[1].address, accounts[2].address), true);
  });

  it('should revert when querying owner of non-existent token', async () => {
    const nonExistentTokenId = 99;
    await expect(erc721Facet.ownerOf(nonExistentTokenId)).to.be.revertedWith(
      'ERC721: invalid token ID'
    );
  });
});
