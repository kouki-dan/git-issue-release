import * as core from "@actions/core";
import * as github from "@actions/github";
import * as lib from "./lib";

export async function gitIssueRelease() {
  const release_tag_prefix = core.getInput("release-tag-prefix");
  const release_labels = lib.parseReleaseLabel(core.getInput("release-label"));
  const issue_title = core.getInput("release-issue-title");
  if (typeof process.env.GITHUB_TOKEN !== "string") {
    throw "GITHUB_TOKEN is required";
  }
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  const { owner, repo } = github.context.repo;

  const latest_release = await lib.findLatestRelease(
    owner,
    repo,
    release_tag_prefix,
    octokit
  );
  const previous_tag_name = latest_release?.tag_name;

  let head_commitish: string;
  if (github.context.payload["pull_request"]) {
    head_commitish = github.context.payload["pull_request"]["merge_commit_sha"];
  } else if (github.context.payload["head_commit"]) {
    head_commitish = github.context.payload["head_commit"]["id"];
  } else {
    // TODO: add case of publishing a tag
    head_commitish = "";
    console.warn("faild to find head commit");
  }

  const notes = await lib.generateNotes(
    owner,
    repo,
    head_commitish,
    previous_tag_name,
    octokit
  );

  const openReleaseIssue = await lib.findOpenReleaseIssue(
    owner,
    repo,
    release_labels,
    octokit
  );

  if (openReleaseIssue) {
    await lib.updateReleaseIssue(
      owner,
      repo,
      openReleaseIssue.number,
      issue_title,
      notes,
      octokit
    );
  } else {
    await lib.createReleaseIssue(
      owner,
      repo,
      release_labels,
      issue_title,
      notes,
      octokit
    );
  }

  if (github.context.payload["action"] == "released") {
    const tag_name = github.context.payload["release"]["tag_name"];
    await lib.closeReleasedIssueIfNeeded(
      owner,
      repo,
      release_labels,
      release_tag_prefix,
      tag_name,
      octokit
    );
    return;
  }
}
