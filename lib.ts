import { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;

export type Release = {
  tag_name: string;
};
export async function findLatestRelease(
  owner: string,
  repo: string,
  tag_prefix: string,
  octokit: Octokit
): Promise<Release | null> {
  for await (const response of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/releases",
    {
      owner: owner,
      repo: repo,
    }
  )) {
    for (const release of response.data) {
      if (release.tag_name.startsWith(tag_prefix)) {
        return release;
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
    }
  );

  return release_notes.data.body;
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
  await octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
    owner: owner,
    repo: repo,
    issue_number: issue_number,
    title: title,
    body: body,
  });
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

export async function closeReleasedIssue(
  owner: string,
  repo: string,
  release_labels: string[],
  released_tag_name: string,
  octokit: Octokit
): Promise<void> {
  const latest_open_release_issue = await findOpenReleaseIssue(
    owner,
    repo,
    release_labels,
    octokit
  );
  if (latest_open_release_issue === null) {
    console.warn("Cannot find a open release issue");
    return;
  }

  const html_url = `https://github.com/{owner}/{repo}/releases/tag/{released_tag_name}`;

  await octokit.rest.issues.createComment({
    owner: owner,
    repo: repo,
    issue_number: latest_open_release_issue.number,
    body: "Released: " + html_url,
  });

  await octokit.rest.issues.update({
    owner: owner,
    repo: repo,
    issue_number: latest_open_release_issue.number,
    state: "closed",
  });
}

export function parseReleaseLabel(release_label: string): string[] {
  return [release_label];
}
