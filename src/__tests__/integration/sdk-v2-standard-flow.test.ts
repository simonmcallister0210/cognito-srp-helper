import { faker } from "@faker-js/faker";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import dotenv from "dotenv";
import path from "path";
import RandExp from "randexp";

import {
  createPasswordHash,
  createSecretHash,
  createSrpSession,
  signSrpSession,
  wrapAuthChallenge,
  wrapInitiateAuth,
} from "../../cognito-srp-helper";

import { signupV2 } from "./helpers";

// Load in env variables from .env if it / they exist..

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

// Assert environment variables exist before we begin

const {
  AWS_REGION = "",
  AWS_ACCESS_KEY_ID = "",
  AWS_SECRET_ACCESS_KEY = "",
  INT_TEST__USERNAME__POOL_ID = "",
  INT_TEST__USERNAME__CLIENT_ID = "",
  INT_TEST__USERNAME__SECRET_ID = "",
  INT_TEST__EMAIL__POOL_ID = "",
  INT_TEST__EMAIL__CLIENT_ID = "",
  INT_TEST__EMAIL__SECRET_ID = "",
  INT_TEST__PHONE__POOL_ID = "",
  INT_TEST__PHONE__CLIENT_ID = "",
  INT_TEST__PHONE__SECRET_ID = "",
} = process.env;

Object.entries({
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  INT_TEST__USERNAME__POOL_ID,
  INT_TEST__USERNAME__CLIENT_ID,
  INT_TEST__USERNAME__SECRET_ID,
  INT_TEST__EMAIL__POOL_ID,
  INT_TEST__EMAIL__CLIENT_ID,
  INT_TEST__EMAIL__SECRET_ID,
  INT_TEST__PHONE__POOL_ID,
  INT_TEST__PHONE__CLIENT_ID,
  INT_TEST__PHONE__SECRET_ID,
}).forEach(([key, value]) => {
  if (value === "") {
    throw new ReferenceError(`
      Integration test could not run because ${key} is undefined or empty.

      If you are running this project locally and you need to setup integration
      tests, make sure you follow the guide in CONTRIBUTING. Alternatively, you
      can run just the unit tests locally as the integration tests will be
      triggered when you push to the remote repo
    `);
  }
});

const credentials = [
  {
    testCaseName: "random username and a pre-hashed password",
    username: faker.internet.userName().replace(/\s+/g, ""),
    password: faker.internet.password(20, true, undefined, "A1!"),
    poolId: INT_TEST__USERNAME__POOL_ID,
    clientId: INT_TEST__USERNAME__CLIENT_ID,
    secretId: INT_TEST__USERNAME__SECRET_ID,
    isPreHashedPassword: true,
  },
  {
    testCaseName: "random username",
    username: faker.internet.userName().replace(/\s+/g, ""),
    password: faker.internet.password(20, true, undefined, "A1!"),
    poolId: INT_TEST__USERNAME__POOL_ID,
    clientId: INT_TEST__USERNAME__CLIENT_ID,
    secretId: INT_TEST__USERNAME__SECRET_ID,
    isPreHashedPassword: false,
  },
  {
    testCaseName: "random email",
    username: faker.internet.email(),
    password: faker.internet.password(20, true, undefined, "A1!"),
    poolId: INT_TEST__EMAIL__POOL_ID,
    clientId: INT_TEST__EMAIL__CLIENT_ID,
    secretId: INT_TEST__EMAIL__SECRET_ID,
    isPreHashedPassword: false,
  },
  {
    testCaseName: "random phone",
    username: new RandExp(/^\+1\d{10}$/).gen(),
    password: faker.internet.password(20, true, undefined, "A1!"),
    poolId: INT_TEST__PHONE__POOL_ID,
    clientId: INT_TEST__PHONE__CLIENT_ID,
    secretId: INT_TEST__PHONE__SECRET_ID,
    isPreHashedPassword: false,
  },
];

describe("SDK v2 integration - USER_SRP_AUTH flow", () => {
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  // signup with all the test credentials before we begin testing
  beforeAll(async () =>
    Promise.all(
      credentials.map((creds) =>
        signupV2({
          cognitoIdentityServiceProvider,
          ...creds,
        }),
      ),
    ),
  );

  it.each(credentials)("normal flow with $testCaseName", async (credentials) => {
    const { username, password, poolId, clientId, secretId, isPreHashedPassword } = credentials;

    const secretHash = createSecretHash(username, clientId, secretId);
    const passwordHash = isPreHashedPassword ? createPasswordHash(username, password, poolId) : password;
    const srpSession = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

    const initiateAuthRes = await cognitoIdentityServiceProvider
      .initiateAuth(
        wrapInitiateAuth(srpSession, {
          ClientId: clientId,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      )
      .promise()
      .catch((err) => {
        throw err;
      });

    const signedSrpSession = signSrpSession(srpSession, initiateAuthRes);

    const respondToAuthChallengeRes = await cognitoIdentityServiceProvider
      .respondToAuthChallenge(
        wrapAuthChallenge(signedSrpSession, {
          ClientId: clientId,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      )
      .promise()
      .catch((err) => {
        throw err;
      });

    expect(respondToAuthChallengeRes).toHaveProperty("AuthenticationResult");
    expect(respondToAuthChallengeRes.AuthenticationResult).toHaveProperty("AccessToken");
    expect(respondToAuthChallengeRes.AuthenticationResult).toHaveProperty("RefreshToken");
  });

  it.each(credentials)("admin flow with $testCaseName", async (credentials) => {
    const { username, password, poolId, clientId, secretId, isPreHashedPassword } = credentials;
    const secretHash = createSecretHash(username, clientId, secretId);
    const passwordHash = isPreHashedPassword ? createPasswordHash(username, password, poolId) : password;
    const srpSession = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

    const adminInitiateAuthRes = await cognitoIdentityServiceProvider
      .adminInitiateAuth(
        wrapInitiateAuth(srpSession, {
          UserPoolId: poolId,
          ClientId: clientId,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      )
      .promise()
      .catch((err) => {
        throw err;
      });

    const signedSrpSession = signSrpSession(srpSession, adminInitiateAuthRes);

    const adminRespondToAuthChallengeRes = await cognitoIdentityServiceProvider
      .adminRespondToAuthChallenge(
        wrapAuthChallenge(signedSrpSession, {
          UserPoolId: poolId,
          ClientId: clientId,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      )
      .promise()
      .catch((err) => {
        throw err;
      });

    expect(adminRespondToAuthChallengeRes).toHaveProperty("AuthenticationResult");
    expect(adminRespondToAuthChallengeRes.AuthenticationResult).toHaveProperty("AccessToken");
    expect(adminRespondToAuthChallengeRes.AuthenticationResult).toHaveProperty("RefreshToken");
  });
});
