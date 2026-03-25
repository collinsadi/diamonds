/* global describe it before */

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

const { assert, expect } = require('chai')
const { ethers } = require('hardhat')

describe('DiamondTest', async function () {
  let diamondAddress
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet
  let erc20Facet
  let tx
  let receipt
  let result
  let accounts
  const addresses = []

  before(async function () {
    // Get all signers
    accounts = await ethers.getSigners()
    
    diamondAddress = await deployDiamond()
    
    // Get the contract factories
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
    const DiamondLoupeFacet = await ethers.getContractFactory('DiamondLoupeFacet')
    const OwnershipFacet = await ethers.getContractFactory('OwnershipFacet')
    const ERC20Facet = await ethers.getContractFactory('ERC20Facet')
    
    // Attach the contracts to the diamond address
    diamondCutFacet = DiamondCutFacet.attach(diamondAddress)
    diamondLoupeFacet = DiamondLoupeFacet.attach(diamondAddress)
    ownershipFacet = OwnershipFacet.attach(diamondAddress)
    erc20Facet = ERC20Facet.attach(diamondAddress)
  })

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
    }

    assert.equal(addresses.length, 4)
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(diamondCutFacet).raw()
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
    assert.deepEqual(
      result.map(s => s.toLowerCase()),
      selectors.map(s => s.toLowerCase())
    )
    
    selectors = getSelectors(diamondLoupeFacet).raw()
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
    assert.deepEqual(
      result.map(s => s.toLowerCase()),
      selectors.map(s => s.toLowerCase())
    )
    
    selectors = getSelectors(ownershipFacet).raw()
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
    assert.deepEqual(
      result.map(s => s.toLowerCase()),
      selectors.map(s => s.toLowerCase())
    )
  })

  it('facets should have the right function selectors for ERC20Facet', async () => {
    let selectors = getSelectors(erc20Facet).raw()
    let result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3])
    assert.deepEqual(
      result.map(s => s.toLowerCase()),
      selectors.map(s => s.toLowerCase())
    )
  })

  it('selectors should be associated with facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1], 
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress('0xf2fde38b')
    )
    assert.equal(
      addresses[3],
      await diamondLoupeFacet.facetAddress('0x18160ddd') 
    )
  })

  it('should mint tokens correctly', async () => {
    const amount = ethers.parseEther("100")
    await erc20Facet.mint(accounts[1].address, amount)
    assert.equal(await erc20Facet.balanceOf(accounts[1].address), amount)
  })

  it('should transfer tokens correctly', async () => {
    const amount = ethers.parseEther("50")
    await erc20Facet.mint(accounts[1].address, amount)
    await erc20Facet.connect(accounts[1]).transfer(accounts[2].address, amount)
    assert.equal(await erc20Facet.balanceOf(accounts[2].address), amount)
  })

  it('should approve and transferFrom tokens correctly', async () => {
    const amount = ethers.parseEther("100")
    await erc20Facet.mint(accounts[1].address, amount)
    await erc20Facet.connect(accounts[1]).approve(accounts[2].address, amount)
    assert.equal(await erc20Facet.allowance(accounts[1].address, accounts[2].address), amount)
    
    await erc20Facet.connect(accounts[2]).transferFrom(accounts[1].address, accounts[3].address, amount)
    assert.equal(await erc20Facet.balanceOf(accounts[3].address), amount)
  })


  it('should revert when transferring with insufficient balance', async () => {
    const amount = ethers.parseEther("1000")
    await expect(
      erc20Facet.connect(accounts[1]).transfer(accounts[2].address, amount)
    ).to.be.revertedWithCustomError(erc20Facet, "ERC20InsufficientBalance")
  })
})