const scaffoldERC20Foundry = require("./scaffoldERC20Foundry");
const {
  scaffoldERC20HardhatJavascript,
  scaffoldERC20HardhatTypescript,
} = require("./ScaffoldERC20Hardhat");

const scaffoldERC20 = (projectName, framework, language) => {
  if (framework === "Foundry") {
    scaffoldERC20Foundry(projectName);
  } else if (framework === "Hardhat" && language === "JavaScript") {
    scaffoldERC20HardhatJavascript(projectName);
  } else if (framework === "Hardhat" && language === "TypeScript") {
    scaffoldERC20HardhatTypescript(projectName);
  }
};

module.exports = scaffoldERC20;
