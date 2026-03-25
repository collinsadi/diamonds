/* global ethers */

const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

// get function selectors from ABI
function getSelectors(contract) {
  const signatures = Object.values(contract.interface.fragments)
    .filter(fragment => fragment.type === 'function')
    .map(fragment => fragment.format());

  const selectors = signatures.reduce((acc, val) => {
    if (val !== 'init(bytes)') {
      try {
        acc.push(contract.interface.getFunction(val).selector)
      } catch (e) {
        // Handle overloaded functions by getting all matching functions
        const matchingFunctions = Object.values(contract.interface.fragments)
          .filter(f => f.type === 'function' && f.name === val.split('(')[0]);
        
        matchingFunctions.forEach(func => {
          if (!acc.includes(func.selector)) {
            acc.push(func.selector);
          }
        });
      }
    }
    return acc
  }, [])
  selectors.contract = contract
  selectors.remove = remove
  selectors.get = get
  selectors.raw = function () { return [...this.filter(s => typeof s === 'string')] }
  return selectors
}

// Rest of the code remains the same...
function getSelector(func) {
  const abiInterface = new ethers.Interface([func])
  return abiInterface.getFunction(func).selector
}

function remove(functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      try {
        if (v === this.contract.interface.getFunction(functionName).selector) {
          return false
        }
      } catch (e) {
        const matchingFunctions = Object.values(this.contract.interface.fragments)
          .filter(f => f.type === 'function' && f.name === functionName.split('(')[0]);
        
        for (const func of matchingFunctions) {
          if (v === func.selector) {
            return false;
          }
        }
      }
    }
    return true
  })
  selectors.contract = this.contract
  selectors.remove = this.remove
  selectors.get = this.get
  selectors.raw = this.raw
  return selectors
}

function get(functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      try {
        if (v === this.contract.interface.getFunction(functionName).selector) {
          return true
        }
      } catch (e) {
        const matchingFunctions = Object.values(this.contract.interface.fragments)
          .filter(f => f.type === 'function' && f.name === functionName.split('(')[0]);
        
        for (const func of matchingFunctions) {
          if (v === func.selector) {
            return true;
          }
        }
      }
    }
    return false
  })
  selectors.contract = this.contract
  selectors.remove = this.remove
  selectors.get = this.get
  selectors.raw = this.raw
  return selectors
}

function removeSelectors(selectors, signatures) {
  const iface = new ethers.Interface(signatures.map(v => 'function ' + v))
  const removeSelectors = signatures.map(v => iface.getFunction(v).selector)
  selectors = selectors.filter(v => !removeSelectors.includes(v))
  return selectors
}

function findAddressPositionInFacets(facetAddress, facets) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}

exports.getSelectors = getSelectors
exports.getSelector = getSelector
exports.FacetCutAction = FacetCutAction
exports.remove = remove
exports.removeSelectors = removeSelectors
exports.findAddressPositionInFacets = findAddressPositionInFacets