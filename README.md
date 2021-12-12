# git-issue-release

This action automatically creates a release issue which includes pull requests after the latest release.
It's inspired by [git-pr-release](https://github.com/x-motemen/git-pr-release).

[![release](https://user-images.githubusercontent.com/1401711/145714638-0608c523-94e2-4fbd-9ba2-bee089922055.png)](https://youtu.be/Q9E6xt5aK3E)

## Inputs

## `release-tag-pattern`

**Required** Prefix of release tag written in regex. git-issue-release uses it to find the latest release. Default `"^v"` (starts with `v`).

## `release-label`

**Required** Label of release issue. git-issue-release uses it to determine an issue as a release issue. An issue created by git-issue-release has these labels. Default `"release"`.

If you want to add multiple labels, you can use a comma-separated string like `release,appname`

CAUTION: Labels are not automatically created. Please create labels before using them.

## `release-issue-title`

Issue title for release issue.

## `release-issue-title-published`

Issue title after published. `:tag_name:` is replaced by a released tag name.


## Example usage

Full example: https://github.com/kouki-dan/git-issue-release/blob/main/.github/workflows/git-issue-release.yml

```yml
name: git-issue-release

on:
  pull_request: # Automatically create or update issues when pull request is merged.
    types: [closed]
  release: # Automatically close the latest issue when release is published.
    types: [published]

jobs:
  action:
    runs-on: ubuntu-latest
    steps:
      - name: git-issue-release
        uses: kouki-dan/git-issue-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          release-tag-pattern: ^v
          release-label: "release"
```
