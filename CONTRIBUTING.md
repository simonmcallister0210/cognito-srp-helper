# How to become a contributor and submit your own code

Table of Contents:

1. [Steps for Implementing a Fix or Feature](#steps-for-implementing-a-fix-or-feature)
2. [Conventional Commit](#conventional-commit)
3. [Releases](#releases)
4. [VSCode setup](#vscode-setup)
5. [Running integration tests locally](#running-integration-tests-locally)
6. [Supporting old major releases](#supporting-old-major-releases)

## Steps for Implementing a Fix or Feature

There's no strict requirements for adding a fix or feature, just open an issue and a PR

## Conventional Commit

This projects follows the Conventional Commit specification (at least for commits on main):

https://www.conventionalcommits.org/en/v1.0.0/

This allows us to categorize changes and make automated updates to our project version and change log based on the categories being merged. For example, if you commit a feature, you could set the commit message to be:

```sh
git commit -m 'feat: my new feature'
```

Once you merge your PR the you should use squash-merge, and the commit message should contain all these [commit messages in the footer](https://github.com/googleapis/release-please#what-if-my-pr-contains-multiple-fixes-or-features), so release-please can track all of the change

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

However, there may be times when you need to fix an integration bug, or make changes to the integration test. In this case you want will want to run integration tests locally. To do this you can ask an code owner for a `.env` file so you can run the tests, or you can setup a Cognito user pool on your own AWS account (or at least have access to one). To create a new user pool follow these steps...

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

AWS_ACCESS_KEY_ID=<aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<aws_secret_access_key>

INT_TEST_USERNAME=<username_of_the_new_user>
INT_TEST_PASSWORD=<password_of_the_new_user>
INT_TEST_POOL_ID=<pool_id_of_the_new_userpool>
INT_TEST_CLIENT_ID=<client_id_of_the_new_app>
INT_TEST_SECRET_ID=<secret_id_of_the_new_app>
INT_TEST_AWS_REGION=<aws_region_of_userpool>
```

After all these steps have been completed, you should be able to run integration tests locally. If you have any problems following these steps feel free to open an issue
