import * as core from "@actions/core";

async function run() {
  try {
    console.log("OK");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
