const fs = require("fs-extra");
const path = require("path");
const scaffoldDefault = require("../helpers/scaffoldDefault/scaffoldDefault");

const processOptions = async (options) => {
  const { projectName, framework, language, template } = options;

  if (template === "Default") {
    scaffoldDefault(projectName, framework);
  }
};

module.exports = processOptions;
