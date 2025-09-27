const path = require("path");
const colors = require("colors");
const templateFolder = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "default",
  "hardhat"
);

const copyTemplateFiles = require("../../utils/file-manager");

exports.scaffoldDefaultHardHatTypeScript = (name) => {
  copyTemplateFiles(path.join(templateFolder, "typescript"), name);
  console.log(
    `You want to Scaffold a Diamond Contract with the Default Hardhat Typescript  Template`
      .yellow
  );
};

exports.scaffoldDefaultHardHatJavaScript = (name) => {
  copyTemplateFiles(path.join(templateFolder, "javascript"), name);
  console.log(
    `You want to Scaffold a Diamond Contract with the Default Hardhat Javascript  Template`
      .yellow
  );
};
