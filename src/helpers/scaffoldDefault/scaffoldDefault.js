const scaffoldDefaultFoundry = require("./scaffoldDefaultFoundry");

const scaffoldDefault = (projectName, framework) => {
  if (framework === "Foundry") {
    scaffoldDefaultFoundry(projectName);
  }
};

module.exports = scaffoldDefault;
