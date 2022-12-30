# How to become a contributor and submit your own code

Table of Contents:

1. [Implementing a fix or feature](#implementing-a-fix-or-feature)
2. [Comitting to the project](#comitting-to-the-project)
3. [Releases](#releases)
4. [VSCode setup](#vscode-setup)
5. [Running integration tests locally](#running-integration-tests-locally)
6. [Supporting older releases](#supporting-older-releases)

## Implementing a fix or feature

First you will need to open a new issue and label it 'enhancement' or 'bug' if it's a feature or fix respectively. Then you can create a new branch from the 'development' tab on the right. This allows us to track the branch related to this issue in Github

## Committing to the project

When commiting to this project, follow the Conventional Commit specification:

https://www.conventionalcommits.org/en/v1.0.0/

This allows use to categorise changes and make automated updates to our project version and change log based on the categories being merged. For example, if you commit a feature, you could set the commit message to be:

```sh
git commit -m 'feat: my new feature'
```

Once you merge your PR the you should use squash-merge, and the commit message should contain all these [commit messages in the footer](https://github.com/googleapis/release-please#what-if-my-pr-contains-multiple-fixes-or-features), so release-please can track all of the change

Then once the release-please draft PR is merged into the main branch, the version is updated from x.1.x to x.2.x and the change log with be updated with the commit message. The project will also be tagged with the updated version

For more information on that this works see [release-please](https://github.com/googleapis/release-please)

## Releases

Releases are automated by the [release-please](https://github.com/googleapis/release-please) bot. The bot create a draft PR that updates itself everytime a branch is merged into main. The the draft PR is merged a few things happen. The change log is updated, the package.json version is updated, the project is tagged with the new version, and the project is uploaded to npm

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

If you've just downloaded this repository and tried to run the integration tests you'll come across some errors to do with missing credentials. Something like:

```sh
TODO: put specific error here
```

This is because we don't store the credentials for our Cognito userpool in code, they are stored as secrets inside Github for use in our Github actions. If you want to run integration tests locally, you'll need to follow these steps

> _NOTE: In most cases you won't need to run integration tests locally as they will be run automatically via Github actions when you update your PR. If however you need to make changes to the integration test, or there's an integration bug you want to fix, then please follow these steps_

### _0. Setup an AWS account if you don't have one already_

You will need to setup a Cognito userpool, which requires an AWS account. If you don't have an AWS account you can find a guide on how to set one up [here](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-creating.html). You will also need to run some AWS CLI commands later on, so [setup AWS CLI]() if you haven't already

### _1. Setup your own userpool_

You need a Cognito userpool to store user credentials in. To do that follow [this](https://docs.aws.amazon.com/cognito/latest/developerguide/tutorial-create-user-pool.html) guide

### _2. Create an app in said userpool_

Inside this new userpool you need to create an app. When creating the new app make sure you add a client secret and have the ALLOW_USER_SRP_AUTH authentication flow enabled. Follow [this](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html) guide

### _3. Create a new user_

Next you need to [create a new user](https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-create-user-accounts.html). There are no special requirements for the user, as long as you have a username and password that should be enough, but for your own convenience you shouldn't send the confirmation email. You wil notice the user has a confirmation status of 'Force change password'. To get around this you need to run this CLI command to permanently set the user's password:

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
```

After all these steps have been completed, you should be able to run integration tests locally. If you have any problems following these steps feel free to open an issue

## Supporting old major releases

To support older major versions you must make sure you create a branch for the older major version before a new major version is released. For example, if we are on v1, and we plan on releasing a braking change to v2, we must create a new branch for v1 just before we release v2

After we have this branch we need to update the Github workflow files to support GitHub actions for this branch. To do this, first checkout the new branch `git checkout 1.x.x` and look for comments in `.github/workflow/*` preceded by 'SUPPORTING OLDER MAJOR VERSIONS'. The comments will tell you what you need to change in order to support these old major releases

_Update 12/2022_ - At time of writing the release-please action will always tag a release as 'latest', so if you release on an old major branch you will need to manually re-tag the latest Github release
