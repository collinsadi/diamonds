#!/usr/bin/env node
const promptUser = require("./utils/promptUser");
const createScaffold = require("./utils/createScaffold");

const run = async () => {
  const options = await promptUser();
  await createScaffold(options);
};

run();
