import { Contract, ContractFactory, Signer } from 'ethers'
import { ethers } from 'hardhat'
import { FacetCut, FacetCutAction } from './types'
import { getSelectors } from './libraries/diamond'

async function deployDiamond(): Promise<string> {
  const accounts: Signer[] = await ethers.getSigners()
  const contractOwner: Signer = accounts[0]

  // deploy DiamondCutFacet
  const DiamondCutFacet: ContractFactory = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet: Contract = await DiamondCutFacet.deploy() as unknown as Contract
  await diamondCutFacet.waitForDeployment()
  const diamondCutFacetAddress: string = await diamondCutFacet.getAddress()
  console.log('DiamondCutFacet deployed:', diamondCutFacetAddress)

  // deploy Diamond
  const Diamond: ContractFactory = await ethers.getContractFactory('Diamond')
  const diamond: Contract = await Diamond.deploy(
    await contractOwner.getAddress(),
    diamondCutFacetAddress
  ) as unknown as Contract
  await diamond.waitForDeployment()
  const diamondAddress: string = await diamond.getAddress()
  console.log('Diamond deployed:', diamondAddress)

  // deploy DiamondInit
  const DiamondInit: ContractFactory = await ethers.getContractFactory('DiamondInit')
  const diamondInit: Contract = await DiamondInit.deploy() as Contract
  await diamondInit.waitForDeployment()
  const diamondInitAddress: string = await diamondInit.getAddress()
  console.log('DiamondInit deployed:', diamondInitAddress)

  // deploy facets
  console.log('')
  console.log('Deploying facets')
  const FacetNames: string[] = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
  ]
  const cut: FacetCut[] = []
  for (const FacetName of FacetNames) {
    const Facet: ContractFactory = await ethers.getContractFactory(FacetName)
    const facet: Contract = await Facet.deploy() as unknown as Contract
    await facet.waitForDeployment()
    const facetAddress: string = await facet.getAddress()
    console.log(`${FacetName} deployed: ${facetAddress}`)
    cut.push({
      facetAddress: facetAddress,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut: Contract = await ethers.getContractAt('IDiamondCut', diamondAddress) as unknown as Contract
  
  // call to init function
  const functionCall: string = diamondInit.interface.encodeFunctionData('init')
  const tx = await diamondCut.diamondCut(cut, diamondInitAddress, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  return diamondAddress
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch((error: Error) => {
      console.error(error)
      process.exit(1)
    })
}

export { deployDiamond }