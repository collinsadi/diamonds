const scaffoldDefaultFoundry = require("./scaffoldDefaultFoundry");
const {
  scaffoldDefaultHardHatJavaScript,
  scaffoldDefaultHardHatTypeScript,
} = require("./ScaffoldDefaultHardhat");

const scaffoldDefault = async (projectName, framework, language) => {
  if (framework === "Foundry") {
    await scaffoldDefaultFoundry(projectName);
  } else if (framework === "Hardhat" && language === "JavaScript") {
    scaffoldDefaultHardHatJavaScript(projectName);
  } else if (framework === "Hardhat" && language === "TypeScript") {
    scaffoldDefaultHardHatTypeScript(projectName);
  }
};

module.exports = scaffoldDefault;
