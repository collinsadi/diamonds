#!/usr/bin/env node
const promptUser = require("./src/utils/promptUser");
const processOptions = require("./src/utils/processOptions");

const run = async () => {
  const options = await promptUser();
  await processOptions(options);
};

run();
