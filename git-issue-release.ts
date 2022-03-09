import * as core from "@actions/core";
import * as github from "@actions/github";
import * as lib from "./lib";
import { GitHub } from "@actions/github/lib/utils";

async function getDescription(
  owner: string,
  repo: string,
  octokit: InstanceType<typeof GitHub>
) {
  const description_file_path = core.getInput("description-file-path");
  if (description_file_path) {
    return await lib.fetchFileContent(
      owner,
      repo,
      description_file_path,
      octokit
    );
  } else {
    return core.getInput("description");
  }
}

export async function gitIssueRelease() {
  const release_tag_pattern = core.getInput("release-tag-pattern");
  const release_labels = lib.parseReleaseLabel(core.getInput("release-label"));
  const issue_title = core.getInput("release-issue-title");
  const configuration_file_path = core.getInput("configuration-file-path");
  if (typeof process.env.GITHUB_TOKEN !== "string") {
    throw "GITHUB_TOKEN is required";
  }
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  const { owner, repo } = github.context.repo;

  const latest_release = await lib.findLatestRelease(
    owner,
    repo,
    release_tag_pattern,
    octokit,
    {
      skip:
        github.context.payload["release"] &&
        (github.context.payload["action"] === "published" ||
          github.context.payload["action"] === "released")
          ? 1
          : 0,
    }
  );
  const previous_tag_name = latest_release?.tag_name;

  let head_commitish: string;
  if (github.context.payload["pull_request"]) {
    // Pull Request
    head_commitish = github.context.payload["pull_request"]["merge_commit_sha"];
  } else if (github.context.payload["head_commit"]) {
    // Push
    head_commitish = github.context.payload["head_commit"]["id"];
  } else if (github.context.payload["release"]) {
    // Release
    head_commitish = github.context.payload["release"]["tag_name"];
  } else {
    head_commitish = "";
    console.warn("faild to find head commit");
  }

  const notes = await lib.generateNotes(
    owner,
    repo,
    head_commitish,
    previous_tag_name,
    configuration_file_path,
    await getDescription(owner, repo, octokit),
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

  if (
    (github.context.payload["action"] === "published" &&
      !github.context.payload["release"]["prerelease"]) ||
    github.context.payload["action"] === "released"
  ) {
    const tag_name = github.context.payload["release"]["tag_name"];
    await lib.closeReleasedIssueIfNeeded(
      owner,
      repo,
      release_labels,
      release_tag_pattern,
      tag_name,
      core.getInput("release-issue-title-published"),
      octokit
    );
    return;
  }
}
