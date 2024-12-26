import { ethers } from 'hardhat';
import { expect, assert } from 'chai';
import {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} from '../scripts/libraries/diamond';
import { deployDiamond } from '../scripts/deploy';

describe('DiamondTest', async function () {
  let diamondAddress: string;
  let diamondCutFacet: any;
  let diamondLoupeFacet: any;
  let ownershipFacet: any;
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

    // Attach the contracts to the diamond address
    diamondCutFacet = DiamondCutFacet.attach(diamondAddress);
    diamondLoupeFacet = DiamondLoupeFacet.attach(diamondAddress);
    ownershipFacet = OwnershipFacet.attach(diamondAddress);
 
  });

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 3);
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


 
});
