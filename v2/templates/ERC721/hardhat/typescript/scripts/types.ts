import { Contract, Interface } from 'ethers'

export enum FacetCutAction {
  Add,
  Replace,
  Remove
}

export interface Selectors extends Array<string> {
  contract: Contract;
  remove: (functionNames: string[]) => Selectors;
  get: (functionNames: string[]) => Selectors;
  raw: () => string[];
}

export interface FacetCut {
  facetAddress: string;
  action: FacetCutAction;
  functionSelectors: string[];
}