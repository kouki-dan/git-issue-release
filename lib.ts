import { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;

export type Release = {
  tag_name: string;
};
export async function findLatestRelease(
  owner: string,
  repo: string,
  tag_pattern: string,
  octokit: Octokit,
  option?: {
    skip: number | undefined;
  }
): Promise<Release | null> {
  let skip = option?.skip ?? 0;
  for await (const response of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/releases",
    {
      owner: owner,
      repo: repo,
    }
  )) {
    for (const release of response.data) {
      if (release.draft) {
        // tag_name of draft release does not exist in repository yet.
        continue;
      }
      if (new RegExp(tag_pattern).test(release.tag_name)) {
        if (skip <= 0) {
          return release;
        } else {
          skip -= 1;
        }
      }
    }
  }

  return null;
}

export async function generateNotes(
  owner: string,
  repo: string,
  head_commitish: string,
  previous_tag_name: string | undefined,
  configuration_file_path: string,
  description: string,
  octokit: Octokit
): Promise<string> {
  const release_notes = await octokit.request(
    "POST /repos/{owner}/{repo}/releases/generate-notes",
    {
      owner: owner,
      repo: repo,
      tag_name: head_commitish,
      target_commitish: head_commitish,
      previous_tag_name: previous_tag_name,
      configuration_file_path: configuration_file_path,
    }
  );
  if (description) {
    return description + "\n" + release_notes.data.body;
  } else {
    return release_notes.data.body;
  }
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
  const issues = await octokit.request("GET /repos/{owner}/{repo}/issues", {
    owner: owner,
    repo: repo,
    labels: release_labels.join(","),
    state: "open",
  });

  if (issues.data.length > 0) {
    return issues.data[0];
  } else {
    return null;
  }
}

export async function updateReleaseIssue(
  owner: string,
  repo: string,
  issue_number: number,
  title: string,
  body: string,
  octokit: Octokit
): Promise<void> {
  // TODO: Get current issue body and merge it.
  try {
    await octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
      owner: owner,
      repo: repo,
      issue_number: issue_number,
      title: title,
      body: body,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function createReleaseIssue(
  owner: string,
  repo: string,
  release_labels: string[],
  title: string,
  body: string,
  octokit: Octokit
): Promise<Issue> {
  const exsisting_labels_response = await octokit.request(
    "GET /repos/{owner}/{repo}/labels",
    {
      owner: owner,
      repo: repo,
    }
  );
  const labels = exsisting_labels_response.data.filter((l) =>
    release_labels.includes(l.name)
  );

  if (labels.length != release_labels.length) {
    throw Error("Label has not been created. You should create a label.");
  }

  const created_issue = await octokit.rest.issues.create({
    owner: owner,
    repo: repo,
    title: title,
    body: body,
    labels: labels,
  });
  return created_issue.data;
}

export async function closeReleasedIssueIfNeeded(
  owner: string,
  repo: string,
  release_labels: string[],
  tag_pattern: string,
  released_tag_name: string,
  issue_title_released: string,
  octokit: Octokit
): Promise<boolean> {
  if (!new RegExp(tag_pattern).test(released_tag_name)) {
    return false;
  }
  const latest_open_release_issue = await findOpenReleaseIssue(
    owner,
    repo,
    release_labels,
    octokit
  );
  if (latest_open_release_issue === null) {
    console.warn("Could not find a open release issue");
    return false;
  }

  const html_url = `https://github.com/${owner}/${repo}/releases/tag/${released_tag_name}`;

  await octokit.rest.issues.createComment({
    owner: owner,
    repo: repo,
    issue_number: latest_open_release_issue.number,
    body: "Released: " + html_url,
  });

  const title = issue_title_released
    ? composePublishedIssueTitle(issue_title_released, released_tag_name)
    : undefined;

  await octokit.rest.issues.update({
    owner: owner,
    repo: repo,
    title: title,
    issue_number: latest_open_release_issue.number,
    state: "closed",
  });
  return true;
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  octokit: Octokit
): Promise<string> {
  const content = await octokit.rest.repos.getContent({
    owner: owner,
    repo: repo,
    path: path,
  });

  if (Array.isArray(content.data)) {
    throw Error(`${path} is a not file, it is a directory`);
  }

  if (content.data.type === "file" && "content" in content.data) {
    return Buffer.from(content.data.content, "base64").toString();
  } else {
    throw Error(`${path} is a not file, it may be a simlink or a submodule`);
  }
}

function composePublishedIssueTitle(title: string, tag_name: string): string {
  return title.replace(/:tag_name:/g, tag_name);
}

export function parseReleaseLabel(release_label: string): string[] {
  return release_label.split(",").map((l) => l.trim());
}
