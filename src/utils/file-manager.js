const fs = require("fs");
const path = require("path");

const templateFolder = path.join(__dirname, "templates");

/**
 * Copies files from the template directory to the target directory.
 *
 * @param {string} templateDir - The path to the template directory in the npm package.
 * @param {string} targetDir - The path to the user's specified directory.
 */
function copyTemplateFiles(templateDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.readdirSync(templateDir).forEach((file) => {
    const templateFilePath = path.join(templateDir, file);
    const targetFilePath = path.join(targetDir, file);

    if (fs.statSync(templateFilePath).isDirectory()) {
      // If the current file is a directory, recursively copy files inside it
      copyTemplateFiles(templateFilePath, targetFilePath);
    } else {
      // Copy file to target directory
      fs.copyFileSync(templateFilePath, targetFilePath);
    }
  });
}

// Example usage
// Adjust if needed
// const userTargetFolder = '/path/to/new/project';  // User-specified folder
// copyTemplateFiles(templateFolder, userTargetFolder);

module.exports = copyTemplateFiles;
