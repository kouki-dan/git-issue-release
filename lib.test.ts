import * as lib from "./lib";

let octokit: any = {};

test("findLatestRelease", () => {
  expect(lib.findLatestRelease("v1.0.0", octokit)).resolves.toBeNull();
});

test("generateNotes", () => {
  expect(
    lib.generateNotes("owner", "repo", "head_commitish", "v1.0.0", octokit)
  ).resolves.toBe("TODO: generate notes");
});

describe("findOpenReleaseIssue", () => {
  test("No release issue", () => {
    octokit.request = jest.fn((endpoint, args) => {
      expect(endpoint).toBe("GET /repos/{owner}/{repo}/issues");
      expect(args["labels"]).toBe("Release");
      expect(args["state"]).toBe("open");
      return Promise.resolve({ data: [] });
    });
    expect(
      lib.findOpenReleaseIssue("owner", "repo", ["Release"], octokit)
    ).resolves.toBeNull();
  });

  test("Has release issue", () => {
    octokit.request = jest.fn((endpoint, args) => {
      expect(endpoint).toBe("GET /repos/{owner}/{repo}/issues");
      expect(args["labels"]).toBe("Release");
      expect(args["state"]).toBe("open");

      return Promise.resolve({
        data: [
          {
            number: 1,
          },
        ],
      });
    });
    expect(
      lib.findOpenReleaseIssue("owner", "repo", ["Release"], octokit)
    ).resolves.toMatchObject({ number: 1 });
  });

  test("Multiple labels are separated by commas", () => {
    octokit.request = jest.fn((endpoint, args) => {
      expect(endpoint).toBe("GET /repos/{owner}/{repo}/issues");
      expect(args["labels"]).toBe("Release,Release2");
      expect(args["state"]).toBe("open");

      return Promise.resolve({ data: [] });
    });
    expect(
      lib.findOpenReleaseIssue(
        "owner",
        "repo",
        ["Release", "Release2"],
        octokit
      )
    ).resolves.toBeNull();
  });
});

test("updateReleaseIssue", () => {
  octokit.request = jest.fn((endpoint, args) => {
    expect(endpoint).toBe("PATCH /repos/{owner}/{repo}/issues/{issue_number}");
    expect(args["title"]).toBe("title");
    expect(args["body"]).toBe("body");
    expect(args["issue_number"]).toBe(1);
  });
  return lib.updateReleaseIssue("owner", "repo", 1, "title", "body", octokit);
});

describe("createReleaseIssue", () => {
  test("Has enough labels", () => {
    octokit.request = jest.fn((_) =>
      Promise.resolve({
        data: [
          {
            name: "hoge",
          },
          {
            name: "Release",
          },
        ],
      })
    );
    octokit.rest = {
      issues: {
        create: jest.fn((_) =>
          Promise.resolve({
            data: {
              number: 1,
            },
          })
        ),
      },
    };
    expect(
      lib.createReleaseIssue(
        "owner",
        "repo",
        ["Release"],
        "title",
        "body",
        octokit
      )
    ).resolves.toMatchObject({ number: 1 });
  });

  test("Labels has not been created.", () => {
    octokit.request = jest.fn((_) =>
      Promise.resolve({
        data: [
          {
            name: "hoge",
          },
        ],
      })
    );
    return expect(
      lib.createReleaseIssue(
        "owner",
        "repo",
        ["Release"],
        "title",
        "body",
        octokit
      )
    ).rejects.toThrow("Label has not been created.");
  });
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
