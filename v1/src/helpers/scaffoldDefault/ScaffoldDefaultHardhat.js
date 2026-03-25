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

exports.scaffoldDefaultHardatTypeScript = (name) => {
  console.log(
    `You want to Scaffold a Diamond Contract with the Default Hardhat Typescript  Template`
      .yellow
  );
};

exports.scaffoldDefaultHardatJavaScript = (name) => {
  console.log(
    `You want to Scaffold a Diamond Contract with the Default Hardhat Javascript  Template`
      .yellow
  );
};
