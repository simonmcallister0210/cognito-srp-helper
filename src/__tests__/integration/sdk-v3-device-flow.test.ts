import {
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminSetUserMFAPreferenceCommand,
  AdminUpdateDeviceStatusCommand,
  AssociateSoftwareTokenCommand,
  CognitoIdentityProviderClient,
  ConfirmDeviceCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SetUserMFAPreferenceCommand,
  UpdateDeviceStatusCommand,
  VerifySoftwareTokenCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import path from "path";
import RandExp from "randexp";
import { TOTP } from "totp-generator";

import {
  createDeviceVerifier,
  createPasswordHash,
  createSecretHash,
  createSrpSession,
  signSrpSession,
  signSrpSessionWithDevice,
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

const wait = async (time: number) => new Promise((resolve) => setTimeout(resolve, time - new Date().getTime()));

const createCredentials = () => [
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

describe("SDK v3 integration - DEVICE_SRP_AUTH flow", () => {
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
    region: "eu-west-2",
  });

  describe("normal flow", () => {
    const credentials = createCredentials();

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

    it.each(credentials)(
      "$testCaseName",
      async (credentials) => {
        const { username, password, poolId, clientId, secretId, isPreHashedPassword } = credentials;

        const secretHash = createSecretHash(username, clientId, secretId);
        const passwordHash = isPreHashedPassword ? createPasswordHash(username, password, poolId) : password;
        const srpSession1 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

        // ---------- Signin 1. initiate signin attempt ----------

        const initiateAuthRes1 = await cognitoIdentityProviderClient.send(
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
        );

        // ---------- Signin 1. respond to PASSWORD_VERIFIER challenge ----------

        const signedSrpSession1 = signSrpSession(srpSession1, initiateAuthRes1);

        const respondToAuthChallengeRes1a = await cognitoIdentityProviderClient.send(
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
        );

        // ---------- Associate a TOTP token with the user ----------

        const AccessToken = respondToAuthChallengeRes1a.AuthenticationResult?.AccessToken;
        if (!AccessToken) throw Error("AccessToken is undefined");

        const associateSoftwareTokenRes = await cognitoIdentityProviderClient.send(
          new AssociateSoftwareTokenCommand({
            AccessToken,
          }),
        );

        // ---------- Verify the TOTP token with the user ----------

        const { SecretCode } = associateSoftwareTokenRes;
        if (!SecretCode) throw Error("SecretCode is undefined");
        const { otp: otp1, expires } = TOTP.generate(SecretCode);

        await cognitoIdentityProviderClient.send(
          new VerifySoftwareTokenCommand({
            AccessToken,
            UserCode: otp1,
          }),
        );

        // ---------- Set MFA preference to TOTP ----------

        await cognitoIdentityProviderClient.send(
          new AdminSetUserMFAPreferenceCommand({
            UserPoolId: poolId,
            Username: username,
            SoftwareTokenMfaSettings: {
              // won't work unless we associate and verify TOTP token with user
              Enabled: true,
              PreferredMfa: true,
            },
          }),
        );

        // ---------- Wait for a new OTP to generate ----------

        await wait(expires);

        // ---------- Signin 2. initiate signin attempt ----------

        const srpSession2 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);
        const initiateAuthRes2 = await cognitoIdentityProviderClient.send(
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
        );

        // ---------- Signin 2. respond to PASSWORD_VERIFIER challenge ----------

        const signedSrpSession2 = signSrpSession(srpSession2, initiateAuthRes2);
        const USER_ID_FOR_SRP = initiateAuthRes2.ChallengeParameters?.USER_ID_FOR_SRP;
        if (!USER_ID_FOR_SRP) throw Error("USER_ID_FOR_SRP is undefined");
        const secretHash2 = createSecretHash(USER_ID_FOR_SRP, clientId, secretId);

        const respondToAuthChallengeRes2a = await cognitoIdentityProviderClient.send(
          new RespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSession2, {
              ClientId: clientId,
              ChallengeName: "PASSWORD_VERIFIER",
              ChallengeResponses: {
                SECRET_HASH: secretHash2,
                USERNAME: USER_ID_FOR_SRP,
              },
            }),
          ),
        );

        // ---------- Signin 2. respond to SOFTWARE_TOKEN_MFA challenge ----------

        const { otp: otp2 } = TOTP.generate(SecretCode);
        const { Session: Session2a } = respondToAuthChallengeRes2a;

        const respondToAuthChallengeRes2b = await cognitoIdentityProviderClient.send(
          new RespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSession2, {
              ClientId: clientId,
              ChallengeName: "SOFTWARE_TOKEN_MFA",
              ChallengeResponses: {
                SECRET_HASH: secretHash2,
                SOFTWARE_TOKEN_MFA_CODE: otp2,
                USERNAME: USER_ID_FOR_SRP,
              },
              Session: Session2a,
            }),
          ),
        );

        // ---------- Confirm the device (for tracking) ----------

        const DeviceGroupKey = respondToAuthChallengeRes2b?.AuthenticationResult?.NewDeviceMetadata?.DeviceGroupKey;
        const DeviceKey = respondToAuthChallengeRes2b?.AuthenticationResult?.NewDeviceMetadata?.DeviceKey;
        if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");
        if (!DeviceKey) throw Error("DeviceKey is undefined");
        const { DeviceSecretVerifierConfig, DeviceRandomPassword } = createDeviceVerifier(DeviceKey, DeviceGroupKey);

        await cognitoIdentityProviderClient.send(
          new ConfirmDeviceCommand({
            AccessToken,
            DeviceKey,
            DeviceName: "example-friendly-name", // usually this is set a User-Agent
            DeviceSecretVerifierConfig,
          }),
        );

        // ---------- Remember the device (for easier logins) ----------

        await cognitoIdentityProviderClient.send(
          new UpdateDeviceStatusCommand({
            AccessToken,
            DeviceKey,
            DeviceRememberedStatus: "remembered",
          }),
        );

        // ---------- Signin 3. initiate signin attempt ----------

        const srpSession3 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

        const initiateAuthRes3 = await cognitoIdentityProviderClient.send(
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
        );

        // ---------- Signin 3. respond to PASSWORD_VERIFIER challenge ----------

        const signedSrpSession3 = signSrpSession(srpSession3, initiateAuthRes3);

        const respondToAuthChallengeRes3a = await cognitoIdentityProviderClient.send(
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
        );

        // ---------- Signin 3. respond to DEVICE_SRP_AUTH challenge ----------

        const respondToAuthChallengeRes3b = await cognitoIdentityProviderClient.send(
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
        );

        // ---------- Signin 3. respond to DEVICE_PASSWORD_VERIFIER challenge ----------

        const signedSrpSessionWithDevice3 = signSrpSessionWithDevice(
          srpSession3,
          respondToAuthChallengeRes3b,
          DeviceGroupKey,
          DeviceRandomPassword,
        );

        const respondToAuthChallengeRes3c = await cognitoIdentityProviderClient.send(
          new RespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSessionWithDevice3, {
              ClientId: clientId,
              ChallengeName: "DEVICE_PASSWORD_VERIFIER",
              ChallengeResponses: {
                SECRET_HASH: secretHash,
                USERNAME: username,
                DEVICE_KEY: DeviceKey,
              },
              Session: respondToAuthChallengeRes3b.Session,
            }),
          ),
        );

        expect(respondToAuthChallengeRes3c).toHaveProperty("AuthenticationResult");
        expect(respondToAuthChallengeRes3c.AuthenticationResult).toHaveProperty("AccessToken");
        expect(respondToAuthChallengeRes3c.AuthenticationResult).toHaveProperty("RefreshToken");
      },
      1000 * 35 /* 35 seconds = 30 seconds to account for OTP expiration + 5 seconds for standard timeout */,
    );
  });

  describe("admin flow", () => {
    const credentials = createCredentials();

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

    it.each(credentials)(
      "$testCaseName",
      async (credentials) => {
        const { username, password, poolId, clientId, secretId, isPreHashedPassword } = credentials;

        const secretHash = createSecretHash(username, clientId, secretId);
        const passwordHash = isPreHashedPassword ? createPasswordHash(username, password, poolId) : password;
        const srpSession1 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

        // ---------- Signin 1. initiate signin attempt ----------

        const initiateAuthRes1 = await cognitoIdentityProviderClient.send(
          new AdminInitiateAuthCommand(
            wrapInitiateAuth(srpSession1, {
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

        // ---------- Signin 1. respond to PASSWORD_VERIFIER challenge ----------

        const signedSrpSession1 = signSrpSession(srpSession1, initiateAuthRes1);

        const respondToAuthChallengeRes1a = await cognitoIdentityProviderClient.send(
          new AdminRespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSession1, {
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

        // ---------- Associate a TOTP token with the user ----------

        const AccessToken = respondToAuthChallengeRes1a.AuthenticationResult?.AccessToken;
        if (!AccessToken) throw Error("AccessToken is undefined");

        const associateSoftwareTokenRes = await cognitoIdentityProviderClient.send(
          new AssociateSoftwareTokenCommand({
            AccessToken,
          }),
        );

        // ---------- Verify the TOTP token with the user ----------

        const { SecretCode } = associateSoftwareTokenRes;
        if (!SecretCode) throw Error("SecretCode is undefined");
        const { otp: otp1, expires } = TOTP.generate(SecretCode);

        await cognitoIdentityProviderClient.send(
          new VerifySoftwareTokenCommand({
            AccessToken,
            UserCode: otp1,
          }),
        );

        // ---------- Set MFA preference to TOTP ----------

        await cognitoIdentityProviderClient.send(
          new SetUserMFAPreferenceCommand({
            AccessToken,
            SoftwareTokenMfaSettings: {
              // won't work unless we associate and verify TOTP token with user
              Enabled: true,
              PreferredMfa: true,
            },
          }),
        );

        // ---------- Wait for a new OTP to generate ----------

        await wait(expires);

        // ---------- Signin 2. initiate signin attempt ----------

        const srpSession2 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);
        const initiateAuthRes2 = await cognitoIdentityProviderClient.send(
          new AdminInitiateAuthCommand(
            wrapInitiateAuth(srpSession2, {
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

        // ---------- Signin 2. respond to PASSWORD_VERIFIER challenge ----------

        const signedSrpSession2 = signSrpSession(srpSession2, initiateAuthRes2);
        const USER_ID_FOR_SRP = initiateAuthRes2.ChallengeParameters?.USER_ID_FOR_SRP;
        if (!USER_ID_FOR_SRP) throw Error("USER_ID_FOR_SRP is undefined");
        const secretHash2 = createSecretHash(USER_ID_FOR_SRP, clientId, secretId);

        const respondToAuthChallengeRes2a = await cognitoIdentityProviderClient.send(
          new AdminRespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSession2, {
              UserPoolId: poolId,
              ClientId: clientId,
              ChallengeName: "PASSWORD_VERIFIER",
              ChallengeResponses: {
                SECRET_HASH: secretHash2,
                USERNAME: USER_ID_FOR_SRP,
              },
            }),
          ),
        );

        // ---------- Signin 2. respond to SOFTWARE_TOKEN_MFA challenge ----------

        const { otp: otp2 } = TOTP.generate(SecretCode);
        const { Session: Session2a } = respondToAuthChallengeRes2a;

        const respondToAuthChallengeRes2b = await cognitoIdentityProviderClient.send(
          new AdminRespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSession2, {
              UserPoolId: poolId,
              ClientId: clientId,
              ChallengeName: "SOFTWARE_TOKEN_MFA",
              ChallengeResponses: {
                SECRET_HASH: secretHash2,
                SOFTWARE_TOKEN_MFA_CODE: otp2,
                USERNAME: USER_ID_FOR_SRP,
              },
              Session: Session2a,
            }),
          ),
        );

        // ---------- Confirm the device (for tracking) ----------

        const DeviceGroupKey = respondToAuthChallengeRes2b?.AuthenticationResult?.NewDeviceMetadata?.DeviceGroupKey;
        const DeviceKey = respondToAuthChallengeRes2b?.AuthenticationResult?.NewDeviceMetadata?.DeviceKey;
        if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");
        if (!DeviceKey) throw Error("DeviceKey is undefined");
        const { DeviceSecretVerifierConfig, DeviceRandomPassword } = createDeviceVerifier(DeviceKey, DeviceGroupKey);

        await cognitoIdentityProviderClient.send(
          new ConfirmDeviceCommand({
            AccessToken,
            DeviceKey,
            DeviceName: "example-friendly-name", // usually this is set a User-Agent
            DeviceSecretVerifierConfig,
          }),
        );

        // ---------- Remember the device (for easier logins) ----------

        await cognitoIdentityProviderClient.send(
          new AdminUpdateDeviceStatusCommand({
            UserPoolId: poolId,
            Username: USER_ID_FOR_SRP,
            DeviceKey,
            DeviceRememberedStatus: "remembered",
          }),
        );

        // ---------- Signin 3. initiate signin attempt ----------

        const srpSession3 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

        const initiateAuthRes3 = await cognitoIdentityProviderClient.send(
          new AdminInitiateAuthCommand(
            wrapInitiateAuth(srpSession3, {
              UserPoolId: poolId,
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
        );

        // ---------- Signin 3. respond to PASSWORD_VERIFIER challenge ----------

        const signedSrpSession3 = signSrpSession(srpSession3, initiateAuthRes3);

        const respondToAuthChallengeRes3a = await cognitoIdentityProviderClient.send(
          new AdminRespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSession3, {
              UserPoolId: poolId,
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
        );

        // ---------- Signin 3. respond to DEVICE_SRP_AUTH challenge ----------

        const respondToAuthChallengeRes3b = await cognitoIdentityProviderClient.send(
          new AdminRespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSession3, {
              UserPoolId: poolId,
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
        );

        // ---------- Signin 3. respond to DEVICE_PASSWORD_VERIFIER challenge ----------

        const signedSrpSessionWithDevice3 = signSrpSessionWithDevice(
          srpSession3,
          respondToAuthChallengeRes3b,
          DeviceGroupKey,
          DeviceRandomPassword,
        );

        const respondToAuthChallengeRes3c = await cognitoIdentityProviderClient.send(
          new AdminRespondToAuthChallengeCommand(
            wrapAuthChallenge(signedSrpSessionWithDevice3, {
              UserPoolId: poolId,
              ClientId: clientId,
              ChallengeName: "DEVICE_PASSWORD_VERIFIER",
              ChallengeResponses: {
                SECRET_HASH: secretHash,
                USERNAME: username,
                DEVICE_KEY: DeviceKey,
              },
              Session: respondToAuthChallengeRes3b.Session,
            }),
          ),
        );

        expect(respondToAuthChallengeRes3c).toHaveProperty("AuthenticationResult");
        expect(respondToAuthChallengeRes3c.AuthenticationResult).toHaveProperty("AccessToken");
        expect(respondToAuthChallengeRes3c.AuthenticationResult).toHaveProperty("RefreshToken");
      },
      1000 * 35 /* 35 seconds = 30 seconds to account for OTP expiration + 5 seconds for standard timeout */,
    );
  });
});
