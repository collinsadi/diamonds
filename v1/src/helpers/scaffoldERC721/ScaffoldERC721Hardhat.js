const path = require("path");
const colors = require("colors");
const copyTemplateFiles = require("../../utils/file-manager");

const templateFolderJavascript = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "ERC721",
  "hardhat",
  "javascript"
);

const templateFolderTypescript = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "ERC721",
  "hardhat",
  "typescript"
);

exports.scaffoldERC721HardhatJavascript = async (name) => {
  await copyTemplateFiles(templateFolderJavascript, name);
};

exports.scaffoldERC721HardhatTypescript = async (name) => {
  await copyTemplateFiles(templateFolderTypescript, name);
};
