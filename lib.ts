import { Octokit } from "@octokit/core";

export type Release = {
  tag_name: string;
};
export async function findLatestRelease(
  tag_prefix: string,
  octokit: Octokit
): Promise<Release | null> {
  return null;
}

export async function generateNotes(
  owner: string,
  repo: string,
  head_commitish: string,
  previous_tag_name: string,
  octokit: Octokit
): Promise<string> {
  return "TODO: generate notes";
}

export type Issue = {
  number: number;
};
export async function findOpenReleaseIssue(
  owner: string,
  repo: string,
  release_labels: string[],
  octokit: Octokit
): Promise<Issue | null> {
  return null;
}

export async function updateReleaseIssue(
  owner: string,
  repo: string,
  issue_number: number,
  title: string,
  body: string,
  octokit: Octokit
): Promise<void> {}

export async function createReleaseIssue(
  owner: string,
  repo: string,
  release_labels: string[],
  title: string,
  body: string,
  octokit: Octokit
): Promise<Issue> {
  return {
    number: 0,
  };
}

export async function closeReleasedIssueIfNeeded(
  owner: string,
  repo: string,
  release_labels: string[],
  tag_prefix: string,
  released_tag_name: string,
  octokit: Octokit
): Promise<Issue> {
  return {
    number: 0,
  };
}

export function parseReleaseLabel(release_label: string): string[] {
  return [release_label];
}
