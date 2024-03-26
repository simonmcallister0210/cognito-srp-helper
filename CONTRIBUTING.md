# How to become a contributor and submit your own code

Table of Contents:

1. [Steps for Implementing a Fix or Feature](#steps-for-implementing-a-fix-or-feature)
2. [Conventional Commit](#conventional-commit)
3. [Releases](#releases)
4. [Running integration tests locally](#running-integration-tests-locally)

## Steps for Implementing a Fix or Feature

There's no strict requirements for adding a fix or feature, just open an issue and a PR. Code owners will make any necessary amendments

## Conventional Commit

This projects follows the Conventional Commit specification (at least for commits on main):

https://www.conventionalcommits.org/en/v1.0.0/

This allows us to categorize changes and make automated updates to our project version and change log based on the categories being merged

When merging your PR the you should use squash-merge, and use the default PR commit message with a conventional commit prefix, e.g.

```sh
feat: add support for AWS SDK v3 (#23)
```

Then once the release-please draft PR is merged into the main branch, the version is updated from x.1.x to x.2.x and the change log with be updated with the commit message. The project will also be tagged with the updated version

For more information on that this works see [release-please](https://github.com/googleapis/release-please)

## Releases

Releases are automated by the [release-please](https://github.com/googleapis/release-please) bot. The bot creates a draft PR that updates itself everytime a branch is merged into main. When this draft PR is merged a few things happen. The change log is updated, the package.json version is updated, the project is tagged with the new version

Release-please knows what version numbers to update by reading into the Git history of the main branch (or support branch if working on previous major version). This branch will have conventional commits that can be used to figure out the content of a change, and how it should affect the version. For more info see the section on [conventional commits](#conventional-commit)

The release of the NPM package is handled manually. A repo owner / admin will release to NPM after release-please PR has been merged in

## Running integration tests locally

If you've just downloaded this repository and tried to run the integration tests you'll come across an error to do with missing credentials. Something like:

```sh
ReferenceError: Integration test could not run because USERNAME is undefined or empty
```

You don't need to run integration tests locally, they'll be triggered in Github when you push your changes to your branch

However, there may be times when you need to fix an integration bug, or make changes to the integration test. In this case you want will want to run integration tests locally. To do this you can ask an code owner for a `.env` file so you can run the tests
