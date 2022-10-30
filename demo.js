#!/usr/bin/node

const { CognitoSrpHelper } = require("./dist");
const AWS = require("aws-sdk");
const createHmac = require("crypto").createHmac;

// . . . obtain user credentials and setup Cognito client
const username = "ec722fc9-d9fb-4aad-8ad6-9d13d2fa04b2";
const password = "Qwerty2!";
const poolId = "eu-west-2_aX79LEgK5";
const clientId = "3knom04d9ssgmocjoita30ivcf";
const clientSecret = "1em5gq25sets9nrs274pobipek9rnchjlvkh4dutn1gthnd2kddn";
const createSecretHash = (data, secret) =>
  createHmac("SHA256", secret).update(data).digest("base64");
const secretHash = createSecretHash(`${username}${clientId}`, clientSecret);
const cognito = new AWS.CognitoIdentityServiceProvider({
  poolId,
  region: "eu-west-2",
});

(async () => {
  // Initialise helper
  const cognitoSrpHelper = new CognitoSrpHelper();

  // Create a client session
  const clientSession = cognitoSrpHelper.createClientSession(
    username,
    password,
    poolId
  );

  // Initiate password verification with challenge SRP_A
  const initiateAuthResponse = await cognito
    .initiateAuth({
      AuthFlow: "USER_SRP_AUTH",
      AuthParameters: {
        CHALLENGE_NAME: "SRP_A",
        SECRET_HASH: secretHash,
        SRP_A: clientSession.largeA, // Pass the large A from client session
        USERNAME: username,
      },
      ClientId: clientId,
    })
    .promise();

  // Create a server session
  const { SALT, SECRET_BLOCK, SRP_B } =
    initiateAuthResponse.ChallengeParameters;
  const serverSession = cognitoSrpHelper.createServerSession(
    SRP_B,
    SALT,
    SECRET_BLOCK
  );

  // Use the client and server session to calculate password claim
  const passwordSignature = cognitoSrpHelper.computePasswordSignature(
    clientSession,
    serverSession
  );

  // Verify password with passwordSignature
  const respondToAuthChallengeResponse = await cognito
    .respondToAuthChallenge({
      ChallengeName: "PASSWORD_VERIFIER",
      ChallengeResponses: {
        PASSWORD_CLAIM_SECRET_BLOCK: serverSession.secret, // Pass the secret from server session
        PASSWORD_CLAIM_SIGNATURE: passwordSignature, // Pass signature we calculated before
        SECRET_HASH: secretHash,
        TIMESTAMP: clientSession.timestamp, // Pass the timestamp from client session
        USERNAME: username,
      },
      ClientId: clientId,
      Session: initiateAuthResponse.Session,
    })
    .promise();

  console.log(respondToAuthChallengeResponse);
})();

// . . . continue custom authentication flow
