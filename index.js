#!/usr/bin/env node
const promptUser = require("./src/utils/promptUser");
const processOptions = require("./src/utils/processOptions");
const renderTitle = require("./src/utils/renderTitle");
const { execSync } = require('child_process');
const packageJson = require('./package.json');

async function checkForUpdates() {
  try {
    
    const latestVersion = execSync(`npm show ${packageJson.name} version`)
      .toString()
      .trim();
    
 
    if (latestVersion !== packageJson.version) {
      console.log(`\nUpdate available: ${packageJson.version} → ${latestVersion}`);
      console.log('Run "npm install -g @latest" to update\n');
    }
  } catch (error) {
   
    console.error('Unable to check for updates:', error.message);
  }
}

const run = async () => {
  const command = process.argv[2];

  if (command === '--version' || command === '-v') {
    console.log(`Diamond Scaffold v${packageJson.version}`);
    return;
  }

  switch (command) {
    case "init":
      renderTitle();
      const options = await promptUser();
      await processOptions(options);
      break;
      
    case "update":
      console.log('Updating to latest version...');
      try {
        execSync(`npm install -g ${packageJson.name}@latest`, { stdio: 'inherit' });
        console.log('Successfully updated to latest version!');
      } catch (error) {
        console.error('Error updating:', error.message);
      }
      break;

    default:
     
      await checkForUpdates();
      console.log('Unknown command. Available commands: init, update');
      console.log('Use --version or -v to check the current version');
  }
};

run();