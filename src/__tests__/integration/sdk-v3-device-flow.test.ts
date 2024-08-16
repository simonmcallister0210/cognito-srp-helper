import {
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AssociateSoftwareTokenCommand,
  CognitoIdentityProviderClient,
  ConfirmDeviceCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SetUserMFAPreferenceCommand,
  SignUpCommand,
  UpdateDeviceStatusCommand,
  VerifySoftwareTokenCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import dotenv from "dotenv";
import path from "path";

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
import { faker } from "@faker-js/faker";
import RandExp from "randexp";
import { TOTP } from "totp-generator";

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

type SignupOptions = {
  username: string;
  password: string;
  cognitoIdentityProviderClient: CognitoIdentityProviderClient;
  clientId: string;
  secretId: string;
};

const signup = async (options: SignupOptions) => {
  const { username, password, cognitoIdentityProviderClient, clientId, secretId } = options;
  const secretHash = createSecretHash(username, clientId, secretId);

  await cognitoIdentityProviderClient
    .send(
      // There's a pre-signup trigger to auto-confirm new users, so no need to Confirm post signup
      new SignUpCommand({
        ClientId: clientId,
        Username: username,
        Password: password,
        SecretHash: secretHash,
      }),
    )
    .catch((err) => {
      throw err;
    });
};

const wait = async (time: number) => new Promise((resolve) => setTimeout(resolve, time - new Date().getTime()));

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

describe("SDK v3 integration - DEVICE_SRP_AUTH flow", () => {
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
    region: "eu-west-2",
  });

  // signup with all the test credentials before we begin testing
  beforeAll(async () =>
    Promise.all(
      credentials.map((creds) =>
        signup({
          cognitoIdentityProviderClient,
          ...creds,
        }),
      ),
    ),
  );

  it.each(credentials)(
    "normal flow with $testCaseName",
    async (credentials) => {
      const { username, password, poolId, clientId, secretId, isPreHashedPassword } = credentials;

      const secretHash = createSecretHash(username, clientId, secretId);
      const passwordHash = isPreHashedPassword ? createPasswordHash(username, password, poolId) : password;
      const srpSession1 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

      // ---------- Signin 1. initiate signin attempt ----------

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

      const AccessToken = respondToAuthChallengeRes1a.AuthenticationResult?.AccessToken;
      if (!AccessToken) throw Error("AccessToken is undefined");

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
      if (!SecretCode) throw Error("SecretCode is undefined");
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

      const srpSession2 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);
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
      const USER_ID_FOR_SRP = initiateAuthRes2.ChallengeParameters?.USER_ID_FOR_SRP;
      if (!USER_ID_FOR_SRP) throw Error("USER_ID_FOR_SRP is undefined");
      const secretHash2 = createSecretHash(USER_ID_FOR_SRP, clientId, secretId);

      const respondToAuthChallengeRes2a = await cognitoIdentityProviderClient
        .send(
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
                SECRET_HASH: secretHash2,
                SOFTWARE_TOKEN_MFA_CODE: otp2,
                USERNAME: USER_ID_FOR_SRP,
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

      const DeviceGroupKey = respondToAuthChallengeRes2b?.AuthenticationResult?.NewDeviceMetadata?.DeviceGroupKey;
      const DeviceKey = respondToAuthChallengeRes2b?.AuthenticationResult?.NewDeviceMetadata?.DeviceKey;
      if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");
      if (!DeviceKey) throw Error("DeviceKey is undefined");
      const { DeviceSecretVerifierConfig, DeviceRandomPassword } = createDeviceVerifier(DeviceKey, DeviceGroupKey);

      const confirmDeviceRes = await cognitoIdentityProviderClient
        .send(
          new ConfirmDeviceCommand({
            AccessToken,
            DeviceKey,
            DeviceName: "example-friendly-name", // usually this is set a User-Agent
            DeviceSecretVerifierConfig,
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

      const srpSession3 = createSrpSession(username, passwordHash, poolId, isPreHashedPassword);

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
        srpSession3,
        respondToAuthChallengeRes3b,
        DeviceGroupKey,
        DeviceRandomPassword,
      );

      const respondToAuthChallengeRes3c = await cognitoIdentityProviderClient
        .send(
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
        )
        .catch((err) => {
          console.error(err);
          throw err;
        });

      console.log("respondToAuthChallengeRes3c:");
      console.log(respondToAuthChallengeRes3c);

      expect(respondToAuthChallengeRes3c).toHaveProperty("AuthenticationResult");
      expect(respondToAuthChallengeRes3c.AuthenticationResult).toHaveProperty("AccessToken");
      expect(respondToAuthChallengeRes3c.AuthenticationResult).toHaveProperty("RefreshToken");
    },
    1000 * 35 /* 30 seconds to account for OTP expiration, and 5 seconds for standard timeout */,
  );
});
