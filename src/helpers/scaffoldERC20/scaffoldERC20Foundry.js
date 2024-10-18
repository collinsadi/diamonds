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

const scaffoldERC20Foundry = (name) => {
  console.log(
    `You want to Scaffold a Diamond Contract with the ERC20 Foundry Template`
      .yellow
  );
};

module.exports = scaffoldERC20Foundry;
