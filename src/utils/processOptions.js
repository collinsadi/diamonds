const fs = require("fs-extra");
const path = require("path");
const scaffoldDefault = require("../helpers/scaffoldDefault/scaffoldDefault");
const scaffoldERC20 = require("../helpers/scaffoldERC20/scaffoldERC20");

const processOptions = async (options) => {
  const { projectName, framework, language, template } = options;

  if (template === "Default") {
    scaffoldDefault(projectName, framework, language);
  } else if (template === "ERC20") {
    scaffoldERC20(projectName, framework, language);
  }
};

module.exports = processOptions;
