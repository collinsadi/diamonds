const inquirer = require("inquirer");
const prompt = inquirer.createPromptModule();

const promptUser = async () => {
  try {
    const questions = [
      {
        type: "input",
        name: "projectName",
        message: "📝 What is the name of your project?",
        default: "my-app",
      },
      {
        type: "list",
        name: "template",
        message: "📑  What Template would you like to scaffold?",
        choices: ["Default", "ERC20", "ERC721"],
      },
      {
        type: "list",
        name: "framework",
        message: "🔧 Which framework would you like to use?",
        choices: ["Foundry", "Hardhat"],
      },
      {
        type: "list",
        name: "language",
        message: "📚 Which language do you want to use?",
        choices: ["JavaScript", "TypeScript"],
        when: (answers) => answers.framework === "Hardhat",
      },
    ];

    const answers = await prompt(questions);
    return answers;
  } catch (error) {
    throw new Error(`Action Canceled ❌: ${error.message}`);
  }
};

module.exports = promptUser;
