const gitIssueRelease = require("./git-issue-release");

async function run() {
  try {
    await gitIssueRelease();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();