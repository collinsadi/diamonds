import { Contract, Interface, Fragment, FunctionFragment } from 'ethers'
import { FacetCutAction, Selectors, FacetCut } from '../types'

// get function selectors from ABI
export function getSelectors(contract: Contract): Selectors {
  const signatures = Object.values(contract.interface.fragments)
    .filter((fragment): fragment is FunctionFragment => fragment.type === 'function')
    .map(fragment => fragment.format());

  const selectors = signatures.reduce((acc: string[], val: string) => {
    if (val !== 'init(bytes)') {
      try {
        const func = contract.interface.getFunction(val);
        if (func) {
          acc.push(func.selector);
        }
      } catch (e) {
        const matchingFunctions = Object.values(contract.interface.fragments)
          .filter((f): f is FunctionFragment => {
            return f.type === 'function' && 
                   f.format().split('(')[0] === val.split('(')[0];
          });
        
        matchingFunctions.forEach(func => {
          if (!acc.includes(func.selector)) {
            acc.push(func.selector);
          }
        });
      }
    }
    return acc;
  }, []) as Selectors;

  selectors.contract = contract;
  selectors.remove = remove;
  selectors.get = get;
  selectors.raw = function(): string[] { 
    return [...this.filter((s): s is string => typeof s === 'string')];
  };
  return selectors;
}

export function getSelector(func: string): string {
  const abiInterface = new Interface([func]);
  const function_ = abiInterface.getFunction(func);
  if (!function_) {
    throw new Error(`Function ${func} not found`);
  }
  return function_.selector;
}

function remove(this: Selectors, functionNames: string[]): Selectors {
  const selectors = this.filter((v): boolean => {
    for (const functionName of functionNames) {
      try {
        const func = this.contract.interface.getFunction(functionName);
        if (func && v === func.selector) {
          return false;
        }
      } catch (e) {
        const matchingFunctions = Object.values(this.contract.interface.fragments)
          .filter((f): f is FunctionFragment => {
            return f.type === 'function' && 
                   f.format().split('(')[0] === functionName.split('(')[0];
          });
        
        for (const func of matchingFunctions) {
          if (v === func.selector) {
            return false;
          }
        }
      }
    }
    return true;
  }) as Selectors;

  selectors.contract = this.contract;
  selectors.remove = this.remove;
  selectors.get = this.get;
  selectors.raw = this.raw;
  return selectors;
}

function get(this: Selectors, functionNames: string[]): Selectors {
  const selectors = this.filter((v): boolean => {
    for (const functionName of functionNames) {
      try {
        const func = this.contract.interface.getFunction(functionName);
        if (func && v === func.selector) {
          return true;
        }
      } catch (e) {
        const matchingFunctions = Object.values(this.contract.interface.fragments)
          .filter((f): f is FunctionFragment => {
            return f.type === 'function' && 
                   f.format().split('(')[0] === functionName.split('(')[0];
          });
        
        for (const func of matchingFunctions) {
          if (v === func.selector) {
            return true;
          }
        }
      }
    }
    return false;
  }) as Selectors;

  selectors.contract = this.contract;
  selectors.remove = this.remove;
  selectors.get = this.get;
  selectors.raw = this.raw;
  return selectors;
}

export function removeSelectors(selectors: string[], signatures: string[]): string[] {
  const iface = new Interface(signatures.map(v => 'function ' + v));
  const removeSelectors = signatures.map(v => {
    const func = iface.getFunction(v);
    if (!func) {
      throw new Error(`Function ${v} not found`);
    }
    return func.selector;
  });
  return selectors.filter(v => !removeSelectors.includes(v));
}

export function findAddressPositionInFacets(
  facetAddress: string, 
  facets: { facetAddress: string }[]
): number | undefined {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i;
    }
  }
  return undefined;
}

export { FacetCutAction };
