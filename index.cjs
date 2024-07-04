const {
  createSrpSession,
  signSrpSession,
  wrapAuthChallenge,
  wrapInitiateAuth,
  createSecretHash,
  createDeviceVerifier,
  signSrpSessionWithDevice,
} = require("../cognito-srp-helper");
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AssociateSoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
  VerifySoftwareTokenCommand,
  SignUpCommand,
  ConfirmDeviceCommand,
  UpdateDeviceStatusCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { TOTP } = require("totp-generator");
const { faker } = require("@faker-js/faker");

const wait = async (time) => new Promise((resolve) => setTimeout(resolve, time - new Date().getTime()));

(async () => {
  // ---------- Setup credentials for new user ----------

  const username = faker.internet.userName();
  const password = "Qwerty1!";
  const poolId = "eu-west-2_ebRTcgfiK";
  const clientId = "1eci0qkm70jpfov0uo2j1ejep";
  const secretId = "1op7af116gm42riug0brsfku3fr1tl1jn5f54lernp5q1d5mksbv";
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
    region: "eu-west-2",
  });

  console.log("credentials:");
  console.log({ username, password });

  // ---------- Signup with new user ----------

  const secretHash = createSecretHash(username, clientId, secretId);

  const signupRes = await cognitoIdentityProviderClient.send(
    // There's a pre-signup trigger to auto-confirm new users, so no need to Confirm post signup
    new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      SecretHash: secretHash,
    }),
  );

  console.log("signupRes:");
  console.log(signupRes);

  // ---------- Signin 1. initiate signin attempt ----------

  const srpSession1 = createSrpSession(username, password, poolId, false);

  const initiateAuthRes1 = await cognitoIdentityProviderClient
    .send(
      new InitiateAuthCommand(
        wrapInitiateAuth(srpSession1, {
          ClientId: clientId,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("initiateAuthRes1:");
  console.log(initiateAuthRes1);

  // ---------- Signin 1. respond to PASSWORD_VERIFIER challenge ----------

  const signedSrpSession1 = signSrpSession(srpSession1, initiateAuthRes1);

  const respondToAuthChallengeRes1a = await cognitoIdentityProviderClient
    .send(
      new RespondToAuthChallengeCommand(
        wrapAuthChallenge(signedSrpSession1, {
          ClientId: clientId,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("respondToAuthChallengeRes1a:");
  console.log(respondToAuthChallengeRes1a);

  // ---------- Associate a TOTP token with the user ----------

  const { AccessToken } = respondToAuthChallengeRes1a.AuthenticationResult;

  const associateSoftwareTokenRes = await cognitoIdentityProviderClient
    .send(
      new AssociateSoftwareTokenCommand({
        AccessToken,
      }),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("associateSoftwareTokenRes:");
  console.log(associateSoftwareTokenRes);

  // ---------- Verify the TOTP token with the user ----------

  const { SecretCode } = associateSoftwareTokenRes;
  const { otp: otp1, expires: expires1 } = TOTP.generate(SecretCode);

  const verifySoftwareTokenRes = await cognitoIdentityProviderClient
    .send(
      new VerifySoftwareTokenCommand({
        AccessToken,
        UserCode: otp1,
      }),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("verifySoftwareTokenRes:");
  console.log(verifySoftwareTokenRes);

  // ---------- Set MFA preference to TOTP ----------

  const setUserMFAPreferenceRes = await cognitoIdentityProviderClient
    .send(
      new SetUserMFAPreferenceCommand({
        AccessToken,
        SoftwareTokenMfaSettings: {
          // won't work unless we associate and verify TOTP token with user
          Enabled: true,
          PreferredMfa: true,
        },
      }),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("setUserMFAPreferenceRes:");
  console.log(setUserMFAPreferenceRes);

  // ---------- Wait for a new OTP to generate ----------

  console.log("waiting for new OTP . . .");
  await wait(expires1);

  // ---------- Signin 2. initiate signin attempt ----------

  const srpSession2 = createSrpSession(username, password, poolId, false);

  const initiateAuthRes2 = await cognitoIdentityProviderClient
    .send(
      new InitiateAuthCommand(
        wrapInitiateAuth(srpSession2, {
          ClientId: clientId,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("initiateAuthRes2:");
  console.log(initiateAuthRes2);

  // ---------- Signin 2. respond to PASSWORD_VERIFIER challenge ----------

  const signedSrpSession2 = signSrpSession(srpSession2, initiateAuthRes2);

  const respondToAuthChallengeRes2a = await cognitoIdentityProviderClient
    .send(
      new RespondToAuthChallengeCommand(
        wrapAuthChallenge(signedSrpSession2, {
          ClientId: clientId,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
          },
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("respondToAuthChallengeRes2a:");
  console.log(respondToAuthChallengeRes2a);

  // ---------- Signin 2. respond to SOFTWARE_TOKEN_MFA challenge ----------

  const { otp: otp2 } = TOTP.generate(SecretCode);
  const { Session: Session2a } = respondToAuthChallengeRes2a;

  const respondToAuthChallengeRes2b = await cognitoIdentityProviderClient
    .send(
      new RespondToAuthChallengeCommand(
        wrapAuthChallenge(signedSrpSession2, {
          ClientId: clientId,
          ChallengeName: "SOFTWARE_TOKEN_MFA",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            SOFTWARE_TOKEN_MFA_CODE: otp2,
            USERNAME: username,
          },
          Session: Session2a,
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("respondToAuthChallengeRes2b:");
  console.log(respondToAuthChallengeRes2b);

  // ---------- Confirm the device (for tracking) ----------

  const { DeviceGroupKey, DeviceKey } = respondToAuthChallengeRes2b.AuthenticationResult.NewDeviceMetadata;
  const DeviceSecretVerifierConfig = createDeviceVerifier(DeviceKey, DeviceGroupKey);

  const confirmDeviceRes = await cognitoIdentityProviderClient
    .send(
      new ConfirmDeviceCommand({
        AccessToken,
        DeviceKey,
        DeviceName: "example-friendly-name", // usually this is set a User-Agent
        DeviceSecretVerifierConfig: {
          Salt: DeviceSecretVerifierConfig.Salt,
          PasswordVerifier: DeviceSecretVerifierConfig.PasswordVerifier,
        },
      }),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("confirmDeviceRes:");
  console.log(confirmDeviceRes);

  // ---------- Remember the device (for easier logins) ----------

  const updateDeviceStatusRes = await cognitoIdentityProviderClient
    .send(
      new UpdateDeviceStatusCommand({
        AccessToken,
        DeviceKey,
        DeviceRememberedStatus: "remembered",
      }),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("updateDeviceStatusRes:");
  console.log(updateDeviceStatusRes);

  // ---------- Signin 3. initiate signin attempt ----------

  const srpSession3 = createSrpSession(username, password, poolId, false);

  const initiateAuthRes3 = await cognitoIdentityProviderClient
    .send(
      new InitiateAuthCommand(
        wrapInitiateAuth(srpSession3, {
          ClientId: clientId,
          AuthFlow: "USER_SRP_AUTH",
          AuthParameters: {
            CHALLENGE_NAME: "SRP_A",
            SECRET_HASH: secretHash,
            USERNAME: username,
            DEVICE_KEY: DeviceKey,
          },
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("initiateAuthRes3:");
  console.log(initiateAuthRes3);

  // ---------- Signin 3. respond to PASSWORD_VERIFIER challenge ----------

  const signedSrpSession3 = signSrpSession(srpSession3, initiateAuthRes3);

  const respondToAuthChallengeRes3a = await cognitoIdentityProviderClient
    .send(
      new RespondToAuthChallengeCommand(
        wrapAuthChallenge(signedSrpSession3, {
          ClientId: clientId,
          ChallengeName: "PASSWORD_VERIFIER",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
            DEVICE_KEY: DeviceKey,
          },
          Session: initiateAuthRes3.Session,
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("respondToAuthChallengeRes3a:");
  console.log(respondToAuthChallengeRes3a);

  // ---------- Signin 3. respond to DEVICE_SRP_AUTH challenge ----------

  const respondToAuthChallengeRes3b = await cognitoIdentityProviderClient
    .send(
      new RespondToAuthChallengeCommand(
        wrapAuthChallenge(signedSrpSession3, {
          ClientId: clientId,
          ChallengeName: "DEVICE_SRP_AUTH",
          ChallengeResponses: {
            SECRET_HASH: secretHash,
            USERNAME: username,
            DEVICE_KEY: DeviceKey,
          },
          Session: respondToAuthChallengeRes3a.Session,
        }),
      ),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("respondToAuthChallengeRes3b:");
  console.log(respondToAuthChallengeRes3b);

  // ---------- Signin 3. respond to DEVICE_PASSWORD_VERIFIER challenge ----------

  const signedSrpSessionWithDevice3 = signSrpSessionWithDevice(
    signedSrpSession3,
    respondToAuthChallengeRes3b,
    DeviceGroupKey,
    DeviceSecretVerifierConfig.RandomPassword,
    DeviceSecretVerifierConfig.FullPassword,
  );

  const respondToAuthChallengeRes3c = await cognitoIdentityProviderClient
    .send(
      new RespondToAuthChallengeCommand({
        ClientId: clientId,
        ChallengeName: "DEVICE_PASSWORD_VERIFIER",
        ChallengeResponses: {
          SECRET_HASH: secretHash,
          USERNAME: username,
          DEVICE_KEY: DeviceKey,
          TIMESTAMP: signedSrpSessionWithDevice3.timestamp,
          PASSWORD_CLAIM_SECRET_BLOCK: signedSrpSessionWithDevice3.secret,
          PASSWORD_CLAIM_SIGNATURE: signedSrpSessionWithDevice3.passwordSignature,
        },
        Session: respondToAuthChallengeRes3b.Session,
      }),
    )
    .catch((err) => {
      console.error(err);
      throw err;
    });

  console.log("respondToAuthChallengeRes3c:");
  console.log(respondToAuthChallengeRes3c);
})();
