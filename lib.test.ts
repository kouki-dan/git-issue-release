import * as lib from "./lib";

let octokit: any = {};

describe("findLatestRelease", () => {
  test("no release", async () => {
    octokit.paginate = {
      iterator: jest.fn(() => {
        return (async function* () {
          yield {
            data: [],
          };
        })();
      }),
    };
    await expect(
      lib.findLatestRelease("owner", "repo", "^v", octokit)
    ).resolves.toBeNull();
  });

  test("has release but not correct prefix", async () => {
    octokit.paginate = {
      iterator: jest.fn(() => {
        return (async function* () {
          yield {
            data: [
              {
                draft: false,
                tag_name: "0.1.0",
              },
            ],
          };
        })();
      }),
    };
    await expect(
      lib.findLatestRelease("owner", "repo", "^v", octokit)
    ).resolves.toBeNull();
  });

  test("has release", async () => {
    octokit.paginate = {
      iterator: jest.fn(() => {
        return (async function* () {
          yield {
            data: [
              {
                draft: false,
                tag_name: "v0.1.0",
              },
              {
                draft: false,
                tag_name: "v0.0.1",
              },
            ],
          };
        })();
      }),
    };
    await expect(
      lib.findLatestRelease("owner", "repo", "^v", octokit)
    ).resolves.toMatchObject({ tag_name: "v0.1.0" });
  });

  test("has release in next page", async () => {
    octokit.paginate = {
      iterator: jest.fn(() => {
        return (async function* () {
          yield {
            data: [
              {
                draft: false,
                tag_name: "0.1.0",
              },
            ],
          };
          yield {
            data: [
              {
                draft: false,
                tag_name: "v0.1.0",
              },
            ],
          };
        })();
      }),
    };
    await expect(
      lib.findLatestRelease("owner", "repo", "^v", octokit)
    ).resolves.toMatchObject({ tag_name: "v0.1.0" });
  });

  test("skip", async () => {
    octokit.paginate = {
      iterator: jest.fn(() => {
        return (async function* () {
          yield {
            data: [
              {
                draft: false,
                tag_name: "v0.2.0",
              },
            ],
          };
          yield {
            data: [
              {
                draft: false,
                tag_name: "v0.1.0",
              },
            ],
          };
        })();
      }),
    };
    await expect(
      lib.findLatestRelease("owner", "repo", "^v", octokit, { skip: 1 })
    ).resolves.toMatchObject({ tag_name: "v0.1.0" });
  });

  test("draft releases", async () => {
    octokit.paginate = {
      iterator: jest.fn(() => {
        return (async function* () {
          yield {
            data: [
              {
                draft: true,
                tag_name: "v0.2.0",
              },
              {
                draft: false,
                tag_name: "v0.1.0",
              },
            ],
          };
        })();
      }),
    };
    await expect(
      lib.findLatestRelease("owner", "repo", "^v", octokit)
    ).resolves.toMatchObject({ tag_name: "v0.1.0" });
  });
});

test("generateNotes", async () => {
  octokit.request = jest.fn(() => {
    return Promise.resolve({
      data: {
        body: "generated notes",
      },
    });
  });
  await expect(
    lib.generateNotes(
      "owner",
      "repo",
      "head_commitish",
      "v1.0.0",
      "",
      "description",
      octokit
    )
  ).resolves.toBe("description\ngenerated notes");

  await expect(
    lib.generateNotes(
      "owner",
      "repo",
      "head_commitish",
      "v1.0.0",
      "",
      "",
      octokit
    )
  ).resolves.toBe("generated notes");
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
        create: jest.fn((args) => {
          expect(args["labels"].length).toBe(1);
          expect(args["labels"][0]["name"]).toBe("Release");
          return Promise.resolve({
            data: {
              number: 1,
            },
          });
        }),
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

describe("closeReleasedIssueIfNeeded", () => {
  test("match tag prefix", () => {
    octokit.rest = {
      issues: {
        createComment: jest.fn((args) => {
          expect(args["body"]).toBe(
            "Released: https://github.com/owner/repo/releases/tag/v1.0.0"
          );
        }),
        update: jest.fn((args) => {
          expect(args["title"]).toBe("Release: v1.0.0 is released!");
        }),
      },
    };
    expect(
      lib.closeReleasedIssueIfNeeded(
        "owner",
        "repo",
        ["Release"],
        "^v",
        "v1.0.0",
        "Release: :tag_name: is released!",
        octokit
      )
    ).resolves.toBe(true);
  });

  test("no match tag prefix", () => {
    const mock = jest.fn();
    octokit.rest = {
      issues: {
        createComment: mock,
        update: mock,
      },
    };
    expect(
      lib.closeReleasedIssueIfNeeded(
        "owner",
        "repo",
        ["Release"],
        "^v",
        "1.0.0",
        "",
        octokit
      )
    ).resolves.toBe(false);
    expect(mock).not.toBeCalled();
  });

  test("release title is empty", () => {
    octokit.rest = {
      issues: {
        createComment: jest.fn(),
        update: jest.fn((args) => {
          expect(args["title"]).toBe(undefined);
        }),
      },
    };
    expect(
      lib.closeReleasedIssueIfNeeded(
        "owner",
        "repo",
        ["Release"],
        "^v",
        "v1.0.0",
        "",
        octokit
      )
    ).resolves.toBe(true);
  });
});

describe("getDescriptionContent", () => {
  test("in case of a file", async () => {
    octokit.rest = {
      repos: {
        getContent: jest.fn(() => {
          return Promise.resolve({
            data: {
              content: Buffer.from("encoded content").toString("base64"),
              type: "file",
            },
          });
        }),
      },
    };
    await expect(
      lib.fetchFileContent("owner", "repo", "path", octokit)
    ).resolves.toBe("encoded content");
  });

  test("in case of a directory", async () => {
    octokit.rest = {
      repos: {
        getContent: jest.fn(() => {
          return Promise.resolve({
            data: [
              {
                content: Buffer.from("encoded content").toString("base64"),
                type: "file",
              },
            ],
          });
        }),
      },
    };
    await expect(
      lib.fetchFileContent("owner", "repo", "path", octokit)
    ).rejects.toThrow();
  });

  test("in case of a simlink", async () => {
    octokit.rest = {
      repos: {
        getContent: jest.fn(() => {
          return Promise.resolve({
            data: [
              {
                type: "simlink",
              },
            ],
          });
        }),
      },
    };
    await expect(
      lib.fetchFileContent("owner", "repo", "path", octokit)
    ).rejects.toThrow();
  });

  test("in case of a submodule", async () => {
    octokit.rest = {
      repos: {
        getContent: jest.fn(() => {
          return Promise.resolve({
            data: [
              {
                type: "submodule",
              },
            ],
          });
        }),
      },
    };
    await expect(
      lib.fetchFileContent("owner", "repo", "path", octokit)
    ).rejects.toThrow();
  });
});

test("parseReleaseLabel", () => {
  expect(lib.parseReleaseLabel("Release")).toEqual(["Release"]);
  expect(lib.parseReleaseLabel("Release1,Release2")).toEqual([
    "Release1",
    "Release2",
  ]);
  expect(lib.parseReleaseLabel("hoge, fuga")).toEqual(["hoge", "fuga"]);
});
