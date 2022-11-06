import { CognitoIdentityServiceProvider } from "aws-sdk";

import CognitoSrpHelper from "../";

const USERNAME = "jon.doe@email.com";
const PASSWORD = "Qwerty1!";
const POOL_ID = "eu-west-2_hO0Ty9gxy";
const CLIENT_ID = "2e4qrnkr3mbvki7sfjrs6fu2js";

describe("SrpAuthenticationHelper integration tests", () => {
  let cognitoIdentityClient: CognitoIdentityServiceProvider;
  let cognitoSrpHelper: CognitoSrpHelper;

  beforeAll(() => {
    cognitoIdentityClient = new CognitoIdentityServiceProvider({
      region: "eu-west-2",
    });
    cognitoSrpHelper = new CognitoSrpHelper();
  });

  test("Cognito SRP authentication flow", async () => {
    // Create client session
    const clientSession = cognitoSrpHelper.createClientSession(
      USERNAME,
      PASSWORD,
      POOL_ID
    );

    // Initiate SRP auth
    const initiateAuthResponse = await cognitoIdentityClient
      .initiateAuth({
        AuthFlow: "USER_SRP_AUTH",
        AuthParameters: {
          USERNAME,
          CHALLENGE_NAME: "SRP_A",
          SRP_A: clientSession.largeA,
        },
        ClientId: CLIENT_ID,
      })
      .promise();
    expect(initiateAuthResponse).toHaveProperty("ChallengeName");
    expect(initiateAuthResponse.ChallengeName).toEqual("PASSWORD_VERIFIER");
    expect(initiateAuthResponse).toHaveProperty("ChallengeParameters");
    expect(initiateAuthResponse.ChallengeParameters).toHaveProperty("SALT");
    expect(initiateAuthResponse.ChallengeParameters).toHaveProperty(
      "SECRET_BLOCK"
    );
    expect(initiateAuthResponse.ChallengeParameters).toHaveProperty("SRP_B");

    // Retreive Cognito SRP values, and create cognito session
    const cognitoSession = cognitoSrpHelper.createCognitoSession(
      initiateAuthResponse?.ChallengeParameters?.SRP_B,
      initiateAuthResponse?.ChallengeParameters?.SALT,
      initiateAuthResponse?.ChallengeParameters?.SECRET_BLOCK
    );

    // Compute password signature using client and cognito session
    const signatureString = cognitoSrpHelper.computePasswordSignature(
      clientSession,
      cognitoSession
    );

    // Respond to PASSWORD_VERIFIER challenge with password signature
    const respondToAuthChallenge = await cognitoIdentityClient
      .respondToAuthChallenge({
        ClientId: CLIENT_ID,
        ChallengeName: "PASSWORD_VERIFIER",
        ChallengeResponses: {
          TIMESTAMP: clientSession.timestamp,
          USERNAME,
          PASSWORD_CLAIM_SECRET_BLOCK: cognitoSession.secret,
          PASSWORD_CLAIM_SIGNATURE: signatureString,
        },
      })
      .promise();
    expect(respondToAuthChallenge).toHaveProperty("AuthenticationResult");
    expect(respondToAuthChallenge.AuthenticationResult).toHaveProperty(
      "AccessToken"
    );
    expect(respondToAuthChallenge.AuthenticationResult).toHaveProperty(
      "RefreshToken"
    );
  });
});
