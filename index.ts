import * as core from "@actions/core";
import { gitIssueRelease } from "./git-issue-release";

async function run() {
  try {
    await gitIssueRelease();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
