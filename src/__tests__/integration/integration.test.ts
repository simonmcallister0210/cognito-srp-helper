import { CognitoIdentityServiceProvider } from "aws-sdk";
import dotenv from "dotenv";
import path from "path";

import {
  createPasswordHash,
  createSecretHash,
  createSrpSession,
  signSrpSession,
  wrapInitiateAuth,
  wrapAuthChallenge,
} from "../../cognito-srp-helper.js";

// Load in env variables from .env if it / they exist..
dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

// Load in env variables from system if they exist
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
    throw new ReferenceError(
      `Integration test could not run because ${key} is undefined or empty`
    );
  }
});

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  region: AWS_REGION,
});

test("integration test", async () => {
  const secretHash = createSecretHash(USERNAME, CLIENT_ID, SECRET_ID);
  const passwordHash = createPasswordHash(USERNAME, PASSWORD, POOL_ID);
  const srpSession = createSrpSession(USERNAME, passwordHash, POOL_ID);

  // Initiate SRP auth
  const initiateAuthResponse = await cognitoIdentityServiceProvider
    .initiateAuth(
      wrapInitiateAuth(srpSession, {
        AuthFlow: "USER_SRP_AUTH",
        AuthParameters: {
          CHALLENGE_NAME: "SRP_A",
          SECRET_HASH: secretHash,
          USERNAME,
        },
        ClientId: CLIENT_ID,
      })
    )
    .promise()
    .catch((err) => {
      throw err;
    });

  const signedSrpSession = signSrpSession(srpSession, initiateAuthResponse);

  const respondToAuthChallengeResponse = await cognitoIdentityServiceProvider
    .respondToAuthChallenge(
      wrapAuthChallenge(signedSrpSession, {
        ClientId: CLIENT_ID,
        ChallengeName: "PASSWORD_VERIFIER",
        ChallengeResponses: {
          SECRET_HASH: secretHash,
          USERNAME,
        },
      })
    )
    .promise()
    .catch((err) => {
      throw err;
    });

  // Ensure the response from Cognito is what we expect
  expect(respondToAuthChallengeResponse).toHaveProperty("AuthenticationResult");
  expect(respondToAuthChallengeResponse.AuthenticationResult).toHaveProperty(
    "AccessToken"
  );
  expect(respondToAuthChallengeResponse.AuthenticationResult).toHaveProperty(
    "RefreshToken"
  );
});
