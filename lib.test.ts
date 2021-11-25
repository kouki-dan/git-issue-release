import * as lib from "./lib";

const octokit: any = {};

test("findLatestRelease", () => {
  expect(lib.findLatestRelease("v1.0.0", octokit)).resolves.toBeNull();
});

test("generateNotes", () => {
  expect(
    lib.generateNotes("owner", "repo", "head_commitish", "v1.0.0", octokit)
  ).resolves.toBe("TODO: generate notes");
});

test("findOpenReleaseIssue", () => {
  expect(
    lib.findOpenReleaseIssue("owner", "repo", ["Release"], octokit)
  ).resolves.toBeNull();
});

test("updateReleaseIssue", () => {
  return lib.updateReleaseIssue("owner", "repo", 1, "title", "body", octokit);
});

test("createReleaseIssue", () => {
  return lib.createReleaseIssue(
    "owner",
    "repo",
    ["Release"],
    "title",
    "body",
    octokit
  );
});

test("closeReleasedIssueIfNeeded", () => {
  return lib.closeReleasedIssueIfNeeded(
    "owner",
    "repo",
    ["Release"],
    "v",
    "v1.0.0",
    octokit
  );
});

test("parseReleaseLabel", () => {
  expect(lib.parseReleaseLabel("Release")).toEqual(["Release"]);
});
