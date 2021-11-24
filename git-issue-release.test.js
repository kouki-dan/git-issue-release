const github = require('@actions/github');
const gitIssueRelease = require('./git-issue-release');

jest.mock('@actions/github');

test('gitIssueRelease', () => {
  process.env.GITHUB_TOKEN = 'token';
  github.getOctokit.mockResolvedValue({
    // TODO: make octokit mock
  });
  github.context.repo = {
    owner: 'owner',
    repo: 'repo',
  };
  github.context.payload = {
    pull_request: {
      merge_commit_sha: "sha",
    }
  };
  return gitIssueRelease();
});