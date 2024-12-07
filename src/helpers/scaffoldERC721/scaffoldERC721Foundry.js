const path = require("path");
const colors = require("colors");
const copyTemplateFiles = require("../../utils/file-manager");
const templateFolder = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "ERC721",
  "foundry"
);

const scaffoldERC20Foundry = async (name) => {
  await copyTemplateFiles(templateFolder, name);
};

module.exports = scaffoldERC20Foundry;
