const fs = require("fs-extra");
const path = require("path");
const scaffoldDefault = require("../helpers/scaffoldDefault/scaffoldDefault");
const scaffoldERC20 = require("../helpers/scaffoldERC20/scaffoldERC20");
const scaffoldERC721 = require("../helpers/scaffoldERC721/scaffoldERC721");

const processOptions = async (options) => {
  const { projectName, framework, language, template } = options;

  if (template === "Default") {
    await scaffoldDefault(projectName, framework, language);
  } else if (template === "ERC20") {
    scaffoldERC20(projectName, framework, language);
  } else if (template === "ERC721") {
    scaffoldERC721(projectName, framework, language);
  }
};

module.exports = processOptions;
