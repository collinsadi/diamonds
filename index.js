#!/usr/bin/env node
const promptUser = require("./utils/promptUser");
const processOptions = require("./utils/processOptions");

const run = async () => {
  const options = await promptUser();
  await processOptions(options);
};

run();
