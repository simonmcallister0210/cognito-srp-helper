import { CognitoIdentityServiceProvider } from "aws-sdk";
import { createHmac } from "crypto";
import dotenv from "dotenv";
import path from "path";

import CognitoSrpHelper from "../../cognito-srp-helper";

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
} = process.env;

// Assert environment variables exist before we begin
Object.entries({ USERNAME, PASSWORD, POOL_ID, CLIENT_ID, SECRET_ID }).forEach(
  ([key, value]) => {
    if (value === "") {
      throw new ReferenceError(
        `Integration test could not run because ${key} is undefined or empty`
      );
    }
  }
);

// Calculate secret hash required for securely communicating with our userpool
const SECRET_HASH = createHmac("SHA256", SECRET_ID)
  .update(`${USERNAME}${CLIENT_ID}`)
  .digest("base64");

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  region: "eu-west-2",
});
const cognitoSrpHelper = new CognitoSrpHelper();

describe("CognitoSrpHelper integration tests", () => {
  test("USER_SRP_AUTH authentication flow", async () => {
    // Create client session
    const clientSrpSession = cognitoSrpHelper.createClientSrpSession(
      USERNAME,
      PASSWORD,
      POOL_ID
    );

    // Initiate SRP auth
    const initiateAuthResponse = await cognitoIdentityServiceProvider
      .initiateAuth({
        AuthFlow: "USER_SRP_AUTH",
        AuthParameters: {
          CHALLENGE_NAME: "SRP_A",
          SECRET_HASH,
          SRP_A: clientSrpSession.largeA,
          USERNAME,
        },
        ClientId: CLIENT_ID,
      })
      .promise()
      .catch((err) => {
        throw err; // re-throwing the error will stop execution
      });

    // Retreive Cognito SRP values, and create cognito session
    const cognitoSrpSession =
      cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);

    // Create timestamp in format required by Cognito
    const timestamp = cognitoSrpHelper.createTimestamp();

    // Compute password signature using client and cognito session
    const passwordSignature = cognitoSrpHelper.computePasswordSignature(
      clientSrpSession,
      cognitoSrpSession,
      timestamp
    );

    // Respond to PASSWORD_VERIFIER challenge with password signature
    const respondToAuthChallenge = await cognitoIdentityServiceProvider
      .respondToAuthChallenge({
        ClientId: CLIENT_ID,
        ChallengeName: "PASSWORD_VERIFIER",
        ChallengeResponses: {
          PASSWORD_CLAIM_SECRET_BLOCK: cognitoSrpSession.secret,
          PASSWORD_CLAIM_SIGNATURE: passwordSignature,
          SECRET_HASH,
          TIMESTAMP: timestamp,
          USERNAME,
        },
      })
      .promise()
      .catch((err) => {
        throw err; // re-throwing the error will stop execution
      });

    // Ensure the response from Cognito is what we expect
    expect(respondToAuthChallenge).toHaveProperty("AuthenticationResult");
    expect(respondToAuthChallenge.AuthenticationResult).toHaveProperty(
      "AccessToken"
    );
    expect(respondToAuthChallenge.AuthenticationResult).toHaveProperty(
      "RefreshToken"
    );
  });
});
