const fs = require("fs-extra");
const path = require("path");
const colors = require("colors");

const folderExists = async (dir) => {
  try {
    const exists = await fs.pathExists(dir);
    return exists;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const copyTemplateFiles = async (templateDir, name) => {
  const targetDir = path.join(process.cwd(), name);

  const dirExists = await folderExists(targetDir);

  if (dirExists) {
    console.log("Directory Already Exists".red);

    return;
  }

  try {
    await fs.copy(templateDir, targetDir);
    console.log(`🚀 Project created successfully.`.green);
    console.log(`cd ${name}.`.green);
  } catch (err) {
    console.error("❌ Error creating project:".red, err);
  }
};

module.exports = copyTemplateFiles;
