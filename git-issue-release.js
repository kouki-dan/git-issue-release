const core = require('@actions/core');
const github = require('@actions/github');
const lib = require("./lib");

async function gitIssueRelease() {
  const release_tag_prefix = core.getInput('release-tag-prefix');
  const release_labels = lib.parseReleaseLabel(core.getInput('release-label'));
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  const {
    owner,
    repo,
  } = github.context.repo;

  if (github.context.payload["action"] == "released") {
    const tag_name = github.context.payload["release"]["tag_name"];
    await closeReleasedIssueIfNeeded(owner, repo, release_labels, release_tag_prefix, tag_name, octokit);
    return;
  }

  const latest_release = await lib.findLatestRelease(release_tag_prefix, octokit);
  const previous_tag_name = latest_release ? latest_release.tag_name : null;

  const issue_title = "Release"

  let head_commitish
  if (github.context.payload["pull_request"]) {
    head_commitish = github.context.payload["pull_request"]["merge_commit_sha"]
  } else if (github.context.payload["head_commit"]) {
    head_commitish = github.context.payload["head_commit"]["id"]
  } else {
    head_commitish = ""
    console.warn("faild to find head commit");
  }

  const notes = await lib.generateNotes(owner, repo, head_commitish, previous_tag_name);

  const openReleaseIssue = await lib.findOpenReleaseIssue(owner, repo, release_labels, octokit);

  if (openReleaseIssue) {
    await lib.updateReleaseIssue(owner, repo, issue_number, issue_title, notes, octokit);
  } else {
    await lib.createReleaseIssue(owner, repo, release_labels, issue_title, notes, octokit);
  }
}

module.exports = gitIssueRelease;