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

const scaffoldDefaultFoundry = (name) => {
  console.log(
    `You want to Scaffold a Diamond Contract with the Default Foundry Template`
      .yellow
  );
};

module.exports = scaffoldDefaultFoundry;
