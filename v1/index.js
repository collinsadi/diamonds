#!/usr/bin/env node
const promptUser = require("./src/utils/promptUser");
const processOptions = require("./src/utils/processOptions");
const renderTitle = require("./src/utils/renderTitle");
const { execSync } = require('child_process');
const packageJson = require('./package.json');

// Function to check for updates
async function checkForUpdates() {
  try {
    // Get the latest version of the package from npm
    const latestVersion = execSync(`npm show ${packageJson.name} version`)
      .toString()
      .trim();
    
    // Compare the latest version with the current version
    if (latestVersion !== packageJson.version) {
      console.log(`\nUpdate available: ${packageJson.version} → ${latestVersion}`);
      console.log('Run "npm install -g @latest" to update\n');
    }
  } catch (error) {
    // Handle errors during the update check
    console.error('Unable to check for updates:', error.message);
  }
}

// Main function to run the script
const run = async () => {
  // Get the command from the command line arguments
  const command = process.argv[2];

  // Handle version command
  if (command === '--version' || command === '-v') {
    console.log(`Diamond Scaffold v${packageJson.version}`);
    return;
  }

  // Handle different commands
  switch (command) {
    case "init":
      // Render title and prompt user for options
      renderTitle();
      const options = await promptUser();
      await processOptions(options);
      break;
      
    case "update":
      // Update the package to the latest version
      console.log('Updating to latest version...');
      try {
        execSync(`npm install -g ${packageJson.name}@latest`, { stdio: 'inherit' });
        console.log('Successfully updated to latest version!');
      } catch (error) {
        // Handle errors during the update process
        console.error('Error updating:', error.message);
      }
      break;

    default:
      // Check for updates and handle unknown commands
      await checkForUpdates();
      console.log('Unknown command. Available commands: init, update');
      console.log('Use --version or -v to check the current version');
  }
};

// Run the main function
run();