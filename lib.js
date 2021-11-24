
async function findLatestRelease(tag_prefix, octokit) {
  return null;
}

async function generateNotes(owner, repo, head_commitish, previous_tag_name) {
  return "TODO: generate notes";
}

async function findOpenReleaseIssue(owner, repo, release_labels, octokit) {
  return null;
}

async function updateReleaseIssue(owner, repo, issue_number, title, body, octokit) {
}

async function createReleaseIssue(owner, repo, release_labels, title, body, octokit) {
}

async function closeReleasedIssueIfNeeded(owner, repo, release_labels, tag_prefix, released_tag_name, octokit) {
}

function parseReleaseLabel(release_label) {
  return [release_label];
}

module.exports = {
  findLatestRelease,
  generateNotes,
  findOpenReleaseIssue,
  updateReleaseIssue,
  createReleaseIssue,
  closeReleasedIssueIfNeeded,
  parseReleaseLabel,
};