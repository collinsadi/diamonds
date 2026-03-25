const scaffoldERC721Foundry = require("./scaffoldERC721Foundry");
const {
  scaffoldERC721HardhatJavascript,
  scaffoldERC721HardhatTypescript,
} = require("./ScaffoldERC721Hardhat");

const scaffoldERC721 = (projectName, framework, language) => {
  if (framework === "Foundry") {
    scaffoldERC721Foundry(projectName);
  } else if (framework === "Hardhat" && language === "JavaScript") {
    scaffoldERC721HardhatJavascript(projectName);
  } else if (framework === "Hardhat" && language === "TypeScript") {
    scaffoldERC721HardhatTypescript(projectName);
  }
};

module.exports = scaffoldERC721;
