const path = require("path");
const colors = require("colors");
const templateFolder = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "default",
  "foundry"
);
const fs = require("fs-extra");
const copyTemplateFiles = require("../../utils/file-manager");

const scaffoldDefaultFoundry = async (name) => {
  await copyTemplateFiles(templateFolder, name);
};

module.exports = scaffoldDefaultFoundry;
