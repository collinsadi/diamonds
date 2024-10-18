#!/usr/bin/env node
const promptUser = require("./src/utils/promptUser");
const processOptions = require("./src/utils/processOptions");
const renderTitle = require("./src/utils/renderTitle");
const command = process.argv[2];

const run = async () => {
  if (command === "init") {
    renderTitle();
    const options = await promptUser();
    await processOptions(options);
  }
};

run();
