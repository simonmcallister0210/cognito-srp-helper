import {
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { faker } from "@faker-js/faker";
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

import { signupV3 } from "./helpers";

// Load in env variables from .env if it / they exist..

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

// Assert environment variables exist before we begin

const {
  AWS_REGION = "",
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

describe("SDK v3 integration - USER_SRP_AUTH flow", () => {
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
    region: AWS_REGION,
  });

  // signup with all the test credentials before we begin testing
  beforeAll(async () =>
    Promise.all(
      credentials.map((creds) =>
        signupV3({
          cognitoIdentityProviderClient,
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

    const initiateAuthRes = await cognitoIdentityProviderClient.send(
      new InitiateAuthCommand(
        wrapInitiateAuth(srpSession, {
          ClientId: clientId,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      ),
    );

    const signedSrpSession = signSrpSession(srpSession, initiateAuthRes);

    const respondToAuthChallengeRes = await cognitoIdentityProviderClient.send(
      new RespondToAuthChallengeCommand(
        wrapAuthChallenge(signedSrpSession, {
          ClientId: clientId,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      ),
    );

    expect(respondToAuthChallengeRes).toHaveProperty("AuthenticationResult");
    expect(respondToAuthChallengeRes.AuthenticationResult).toHaveProperty("AccessToken");
    expect(respondToAuthChallengeRes.AuthenticationResult).toHaveProperty("RefreshToken");
  });

  it.each(credentials)("admin flow with $testCaseName", async (credentials) => {
    const { username, password, poolId, clientId, secretId, isPreHashedPassword } = credentials;

    const secretHash = createSecretHash(username, clientId, secretId);
    const passwordHash = isPreHashedPassword ? createPasswordHash(username, password, poolId) : password;
    const srpSession = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

    const initiateAuthRes = await cognitoIdentityProviderClient.send(
      new AdminInitiateAuthCommand(
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
      ),
    );

    const signedSrpSession = signSrpSession(srpSession, initiateAuthRes);

    const respondToAuthChallengeRes = await cognitoIdentityProviderClient.send(
      new AdminRespondToAuthChallengeCommand(
        wrapAuthChallenge(signedSrpSession, {
          UserPoolId: poolId,
          ClientId: clientId,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      ),
    );

    expect(respondToAuthChallengeRes).toHaveProperty("AuthenticationResult");
    expect(respondToAuthChallengeRes.AuthenticationResult).toHaveProperty("AccessToken");
    expect(respondToAuthChallengeRes.AuthenticationResult).toHaveProperty("RefreshToken");
  });
});
