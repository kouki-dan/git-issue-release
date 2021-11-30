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

  jest.spyOn(lib, "parseReleaseLabel").mockReturnValue(["Release"]);
  jest.spyOn(lib, "findLatestRelease").mockReturnValue(Promise.resolve(null));
  jest.spyOn(lib, "generateNotes").mockReturnValue(Promise.resolve("notes"));
  jest
    .spyOn(lib, "findOpenReleaseIssue")
    .mockReturnValue(Promise.resolve(null));
  jest.spyOn(lib, "closeReleasedIssue").mockReturnValue(Promise.resolve());

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

  jest.spyOn(lib, "parseReleaseLabel").mockReturnValue(["Release"]);
  jest.spyOn(lib, "findLatestRelease").mockReturnValue(Promise.resolve(null));
  jest.spyOn(lib, "generateNotes").mockReturnValue(Promise.resolve("notes"));
  jest.spyOn(lib, "findOpenReleaseIssue").mockReturnValue(
    Promise.resolve({
      number: 1,
    })
  );
  jest.spyOn(lib, "closeReleasedIssue").mockReturnValue(Promise.resolve());

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
