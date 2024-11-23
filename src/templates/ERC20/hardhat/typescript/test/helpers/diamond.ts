import { Interface, Fragment } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';

export enum FacetCutAction {
  Add = 0,
  Replace = 1,
  Remove = 2
}

interface Facet {
  facetAddress: string;
  functionSelectors: string[];
}

// get function selectors from ABI
export function getSelectors(contract: Contract): string[] {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = signatures.reduce<string[]>((acc, val) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  return selectors;
}

// get function selector from function signature
export function getSelector(func: string): string {
  const abiInterface = new Interface([func]);
  return abiInterface.getSighash(Fragment.from(func));
}

// used with getSelectors to remove selectors from an array of selectors
// functionNames argument is an array of function signatures
export function remove(this: string[] & { contract: Contract }, functionNames: string[]): string[] {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === this.contract.interface.getSighash(functionName)) {
        return false;
      }
    }
    return true;
  });
  return selectors;
}

// used with getSelectors to get selectors from an array of selectors
// functionNames argument is an array of function signatures
export function get(this: string[] & { contract: Contract }, functionNames: string[]): string[] {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === this.contract.interface.getSighash(functionName)) {
        return true;
      }
    }
    return false;
  });
  return selectors;
}

// remove selectors using an array of signatures
export function removeSelectors(selectors: string[], signatures: string[]): string[] {
  const iface = new Interface(
    signatures.map((v) => 'function ' + v)
  );
  const removeSelectors = signatures.map((v) => iface.getSighash(v));
  return selectors.filter((v) => !removeSelectors.includes(v));
}

// find a particular address position in the return value of diamondLoupeFacet.facets()
export function findAddressPositionInFacets(facetAddress: string, facets: Facet[]): number | undefined {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i;
    }
  }
  return undefined;
}