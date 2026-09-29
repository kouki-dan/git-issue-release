import { jest } from "@jest/globals";

// ES modules cannot be spied on directly, so mock them before importing the
// module under test.
const context: any = {};
const octokit: any = {};
const getOctokit = jest.fn(() => octokit);
jest.unstable_mockModule("@actions/github", () => ({
  context,
  getOctokit,
}));

const getInput = jest.fn((name: string): string => {
  return (
    {
      "release-tag-pattern": "^v",
      "release-label": "Release",
      "release-issue-title": "Release Issue",
    } as Record<string, string>
  )[name];
});
jest.unstable_mockModule("@actions/core", () => ({
  getInput,
}));

const actualLib = await import("./lib.js");
const lib = {
  parseReleaseLabel: jest.fn(actualLib.parseReleaseLabel),
  findLatestRelease: jest.fn(actualLib.findLatestRelease),
  generateNotes: jest.fn(actualLib.generateNotes),
  findOpenReleaseIssue: jest.fn(actualLib.findOpenReleaseIssue),
  createReleaseIssue: jest.fn(actualLib.createReleaseIssue),
  updateReleaseIssue: jest.fn(actualLib.updateReleaseIssue),
  closeReleasedIssueIfNeeded: jest.fn(actualLib.closeReleasedIssueIfNeeded),
  fetchFileContent: jest.fn(actualLib.fetchFileContent),
};
jest.unstable_mockModule("./lib.js", () => lib);

const { gitIssueRelease } = await import("./git-issue-release.js");

beforeEach(() => {
  for (const key of Object.keys(context)) {
    delete context[key];
  }
});

test("should create when release issue has not been cretaed", async () => {
  process.env.GITHUB_TOKEN = "token";
  Object.assign(context, {
    repo: {
      owner: "owner",
      repo: "repo",
    },
    payload: {
      pull_request: {
        merged: true,
      },
    },
  });

  lib.parseReleaseLabel.mockReturnValue(["Release"]);
  lib.findLatestRelease.mockReturnValue(Promise.resolve(null));
  lib.generateNotes.mockReturnValue(Promise.resolve("notes"));
  lib.findOpenReleaseIssue.mockReturnValue(Promise.resolve(null));
  lib.closeReleasedIssueIfNeeded.mockReturnValue(Promise.resolve(true));
  lib.createReleaseIssue.mockReturnValue(Promise.resolve({ number: 1 }));

  await gitIssueRelease();

  expect(lib.createReleaseIssue).toHaveBeenCalledWith(
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
  Object.assign(context, {
    repo: {
      owner: "owner",
      repo: "repo",
    },
    payload: {
      pull_request: {
        merged: true,
      },
    },
  });

  lib.parseReleaseLabel.mockReturnValue(["Release"]);
  lib.findLatestRelease.mockReturnValue(Promise.resolve(null));
  lib.generateNotes.mockReturnValue(Promise.resolve("notes"));
  lib.findOpenReleaseIssue.mockReturnValue(
    Promise.resolve({
      number: 1,
    })
  );
  lib.closeReleasedIssueIfNeeded.mockReturnValue(Promise.resolve(true));
  lib.updateReleaseIssue.mockReturnValue(Promise.resolve());

  await gitIssueRelease();

  expect(lib.updateReleaseIssue).toHaveBeenCalledWith(
    "owner",
    "repo",
    1,
    "Release Issue",
    "notes",
    octokit
  );
});
