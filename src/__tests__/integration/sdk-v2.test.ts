import { CognitoIdentityServiceProvider } from "aws-sdk";
import dotenv from "dotenv";
import path from "path";

import {
  createPasswordHash,
  createSecretHash,
  createSrpSession,
  signSrpSession,
  wrapAuthChallenge,
  wrapInitiateAuth,
} from "../../cognito-srp-helper";

// Load in env variables from .env if it / they exist..

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const {
  INT_TEST_USERNAME: USERNAME = "",
  INT_TEST_PASSWORD: PASSWORD = "",
  INT_TEST_POOL_ID: POOL_ID = "",
  INT_TEST_CLIENT_ID: CLIENT_ID = "",
  INT_TEST_SECRET_ID: SECRET_ID = "",
  INT_TEST_AWS_REGION: AWS_REGION = "",
} = process.env;

// Assert environment variables exist before we begin

Object.entries({
  USERNAME,
  PASSWORD,
  POOL_ID,
  CLIENT_ID,
  SECRET_ID,
  AWS_REGION,
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

describe("SDK v2 integration", () => {
  const secretHash = createSecretHash(USERNAME, CLIENT_ID, SECRET_ID);
  const passwordHash = createPasswordHash(USERNAME, PASSWORD, POOL_ID);
  const srpSession = createSrpSession(USERNAME, passwordHash, POOL_ID);
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
    region: AWS_REGION,
  });

  it("should work with initiateAuth and respondToAuthChallenge", async () => {
    const initiateAuthRes = await cognitoIdentityServiceProvider
      .initiateAuth(
        wrapInitiateAuth(srpSession, {
          ClientId: CLIENT_ID,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME,
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
          ClientId: CLIENT_ID,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME,
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

  it("should work with adminInitiateAuth and adminRespondToAuthChallenge", async () => {
    const adminInitiateAuthRes = await cognitoIdentityServiceProvider
      .adminInitiateAuth(
        wrapInitiateAuth(srpSession, {
          UserPoolId: POOL_ID,
          ClientId: CLIENT_ID,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME,
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
          UserPoolId: POOL_ID,
          ClientId: CLIENT_ID,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME,
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
