# How to become a contributor and submit your own code

Table of Contents:

1. [Steps for Implementing a Fix or Feature](#steps-for-implementing-a-fix-or-feature)
2. [Conventional Commit](#conventional-commit)
3. [Releases](#releases)
4. [VSCode setup](#vscode-setup)
5. [Running integration tests locally](#running-integration-tests-locally)
6. [Supporting old major releases](#supporting-old-major-releases)

## Steps for Implementing a Fix or Feature

First you will need to open a new issue and label it 'enhancement' or 'bug', depending on if it's a feature or fix respectively. Then you can create a new branch from the 'development' tab on the right. This allows us to track the branch related to this issue in Github

Ideally we want have similar naming convention to Conventional commits. So bug fix branches should have the prefix fix/..., and feature branches should have the prefix feat/..., documentation change should be docs/..., and so on. Apart from these prefixes feel free to name the branch whatever you want, as long as it's tasteful and concise. E.g:

- feat/new-function
- fix/missing-type
- refactor/crypto-lib-change

## Conventional Commit

This projects follows the Conventional Commit specification (at least for commits on main):

https://www.conventionalcommits.org/en/v1.0.0/

This allows use to categorise changes and make automated updates to our project version and change log based on the categories being merged. For example, if you commit a feature, you could set the commit message to be:

```sh
git commit -m 'feat: my new feature'
```

Once you merge your PR the you should use squash-merge, and the commit message should contain all these [commit messages in the footer](https://github.com/googleapis/release-please#what-if-my-pr-contains-multiple-fixes-or-features), so release-please can track all of the change

Then once the release-please draft PR is merged into the main branch, the version is updated from x.1.x to x.2.x and the change log with be updated with the commit message. The project will also be tagged with the updated version

For more information on that this works see [release-please](https://github.com/googleapis/release-please)

## Releases

Releases are automated by the [release-please](https://github.com/googleapis/release-please) bot. The bot creates a draft PR that updates itself everytime a branch is merged into main. When this draft PR is merged a few things happen. The change log is updated, the package.json version is updated, the project is tagged with the new version, and the project is uploaded to npm

Release-please knows what version numbers to update by reading into the Git history of the main branch (or support branch if working on previous major version). This branch will have conventional commits that can be used to figure out the content of a change, and how it should affect the version. For more info see the section on [conventional commits](#conventional-commit)

## VSCode setup

We don't track our VSCode workspace config in Git, so if you need to setup you project to work with prettier and our eslint config file `config/eslintrc.json` you can create a workspace file similar to this:

```json
{
  "folders": [
    {
      "path": ".."
    }
  ],
  "settings": {
    "editor.tabSize": 2,
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "eslint.options": { "overrideConfigFile": "./config/eslintrc.json" }
  }
}
```

## Running integration tests locally

If you've just downloaded this repository and tried to run the integration tests you'll come across an error to do with missing credentials. Something like:

```sh
ReferenceError: Integration test could not run because USERNAME is undefined or empty
```

This is because we don't store the credentials for our Cognito user pool in code, they are stored as secrets inside Github for use in our Github actions. Integration tests will be triggered when you push your changes. There may be times when you need to fix an integration bug, or make changes to the integration test. In this case you want will want to run integration tests locally. To do this you'll need to setup a Cognito user pool on your own AWS account (or at least have access to one). To create a new user pool follow these steps...

### _0. Setup an AWS account if you don't have one already_

You will need to setup a Cognito user pool, which requires an AWS account. If you don't have an AWS account you can find a guide on how to set one up [here](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-creating.html). You will also need to run some AWS CLI commands later on, so [setup AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) if you haven't already

### _1. Setup your own user pool_

You need a Cognito user pool to store user credentials in. To do that follow [this](https://docs.aws.amazon.com/cognito/latest/developerguide/tutorial-create-user-pool.html) guide

### _2. Create an app in said user pool_

Inside this new user pool you need to create an app. When creating the new app make sure you add a client secret and have the ALLOW_USER_SRP_AUTH authentication flow enabled. Follow [this](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html) guide

### _3. Create a new user_

Next you need to [create a new user](https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-create-user-accounts.html). There are no special requirements for the user, as long as you have a username and password that should be enough, but for your own convenience you shouldn't send the confirmation email. You will notice the user has a confirmation status of 'Force change password'. To get around this you need to run this CLI command to permanently set the user's password:

```sh
aws cognito-idp admin-set-user-password \
  --user-pool-id <your-user-pool-id> \
  --username <username> \
  --password <password> \
  --permanent
```

### _4. Create a `.env` file with the relevant credentials_

Finally in your local repo, create a `.env` file in the root of the project. This file should contain the following:

```sh
# Credentials used in integration test

INT_TEST_USERNAME=<username_of_the_new_user>
INT_TEST_PASSWORD=<password_of_the_new_user>
INT_TEST_POOL_ID=<pool_id_of_the_new_userpool>
INT_TEST_CLIENT_ID=<client_id_of_the_new_app>
INT_TEST_SECRET_ID=<secret_id_of_the_new_app>
INT_TEST_AWS_REGION=<aws_region_of_userpool>
```

After all these steps have been completed, you should be able to run integration tests locally. If you have any problems following these steps feel free to open an issue

## Releasing new major version

To release a new major version you must make sure you create a branch for the old major version. For example, if we are on v1, and we plan on releasing a braking change to v2, we must create a new branch for v1 just before we release v2

After we have this branch old branch (e.g. v1) we need to update the Github workflow files to support GitHub actions for this branch. To do this, first checkout the new branch `git checkout v1` and look for comments in `.github/workflow/*` preceded by 'SUPPORTING OLDER MAJOR VERSIONS'. The comments will tell you what you need to change in order to support the old major version

_Update 12/2022_ - BE AWARE - At time of writing the release-please action will always tag a release as 'latest', so if you release on an old major branch you will need to manually re-tag the latest Github release
