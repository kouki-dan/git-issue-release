import * as github from "@actions/github";
import { gitIssueRelease } from "./git-issue-release";

test("gitIssueRelease", () => {
  process.env.GITHUB_TOKEN = "token";
  process.env.GITHUB_REPOSITORY = "owner/repo";
  const octokit: any = {};
  jest.spyOn(github, "getOctokit").mockReturnValueOnce(octokit);

  return gitIssueRelease();
});
