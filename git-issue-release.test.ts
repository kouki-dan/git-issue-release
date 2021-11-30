import * as github from "@actions/github";
import * as core from "@actions/core";
import * as lib from "./lib";
import { gitIssueRelease } from "./git-issue-release";

test("should create when release issue has not been cretaed", async () => {
  process.env.GITHUB_TOKEN = "token";
  process.env.GITHUB_REPOSITORY = "owner/repo";
  const octokit: any = {};
  jest.spyOn(github, "getOctokit").mockReturnValueOnce(octokit);

  jest.spyOn(core, "getInput").mockImplementation((name) => {
    return {
      "release-tag-prefix": "v",
      "release-label": "Release",
      "release-issue-title": "Release Issue",
    }[name]!;
  });

  const spyParseReleaseLabel = jest.spyOn(lib, "parseReleaseLabel");
  spyParseReleaseLabel.mockReturnValue(["Release"]);

  const spyGenerateNotes = jest.spyOn(lib, "generateNotes");
  spyGenerateNotes.mockReturnValue(Promise.resolve("notes"));

  const spyFindOpenReleaseIssue = jest.spyOn(lib, "findOpenReleaseIssue");
  spyFindOpenReleaseIssue.mockReturnValue(Promise.resolve(null));

  const spyCreateReleaseIssue = jest.spyOn(lib, "createReleaseIssue");
  spyCreateReleaseIssue.mockReturnValue(Promise.resolve({ number: 1 }));

  await gitIssueRelease();

  expect(spyCreateReleaseIssue).toHaveBeenCalledWith(
    "owner",
    "repo",
    ["Release"],
    "Release Issue",
    "notes",
    octokit
  );
});

test("Should update when release issue has been created", async () => {
  process.env.GITHUB_TOKEN = "token";
  process.env.GITHUB_REPOSITORY = "owner/repo";
  const octokit: any = {};
  jest.spyOn(github, "getOctokit").mockReturnValueOnce(octokit);

  const spyParseReleaseLabel = jest.spyOn(lib, "parseReleaseLabel");
  spyParseReleaseLabel.mockReturnValue(["Release"]);

  const spyGenerateNotes = jest.spyOn(lib, "generateNotes");
  spyGenerateNotes.mockReturnValue(Promise.resolve("notes"));

  const spyFindOpenReleaseIssue = jest.spyOn(lib, "findOpenReleaseIssue");
  spyFindOpenReleaseIssue.mockReturnValue(
    Promise.resolve({
      number: 1,
    })
  );

  const spyUpdateReleaseIssue = jest.spyOn(lib, "updateReleaseIssue");
  spyUpdateReleaseIssue.mockReturnValue(Promise.resolve());

  await gitIssueRelease();

  expect(spyUpdateReleaseIssue).toHaveBeenCalledWith(
    "owner",
    "repo",
    1,
    "Release Issue",
    "notes",
    octokit
  );
});
