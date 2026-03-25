const path = require("path");
const colors = require("colors");
const copyTemplateFiles = require("../../utils/file-manager");
const templateFolder = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "ERC20",
  "hardhat"
);

exports.scaffoldERC20HardhatJavascript = (name) => {
  copyTemplateFiles(path.join(templateFolder, "javascript"), name);
};

exports.scaffoldERC20HardhatTypescript = (name) => {
  copyTemplateFiles(path.join(templateFolder, "typescript"), name);
};
