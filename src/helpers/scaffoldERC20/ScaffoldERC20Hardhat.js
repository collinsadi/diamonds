const path = require("path");
const colors = require("colors");
const templateFolder = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "ERC20",
  "hardhat"
);

exports.scaffoldERC20HardhatJavascript = (name) => {
  console.log(
    `You want to Scaffold a Diamond Contract with the ERC20 Hardhat Javascript  Template`
      .yellow
  );
};

exports.scaffoldERC20HardhatTypescript = (name) => {
  console.log(
    `You want to Scaffold a Diamond Contract with the ERC20 Hardhat Typescript  Template`
      .yellow
  );
};
