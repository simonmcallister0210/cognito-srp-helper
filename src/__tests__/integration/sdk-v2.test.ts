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

// Assert environment variables exist before we begin

const {
  AWS_REGION = "",
  AWS_ACCESS_KEY_ID = "",
  AWS_SECRET_ACCESS_KEY = "",
  INT_TEST__USERNAME__USERNAME = "",
  INT_TEST__USERNAME__PASSWORD = "",
  INT_TEST__USERNAME__POOL_ID = "",
  INT_TEST__USERNAME__CLIENT_ID = "",
  INT_TEST__USERNAME__SECRET_ID = "",
  INT_TEST__EMAIL__USERNAME = "",
  INT_TEST__EMAIL__PASSWORD = "",
  INT_TEST__EMAIL__POOL_ID = "",
  INT_TEST__EMAIL__CLIENT_ID = "",
  INT_TEST__EMAIL__SECRET_ID = "",
  INT_TEST__PHONE__USERNAME = "",
  INT_TEST__PHONE__PASSWORD = "",
  INT_TEST__PHONE__POOL_ID = "",
  INT_TEST__PHONE__CLIENT_ID = "",
  INT_TEST__PHONE__SECRET_ID = "",
} = process.env;

Object.entries({
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  INT_TEST__USERNAME__USERNAME,
  INT_TEST__USERNAME__PASSWORD,
  INT_TEST__USERNAME__POOL_ID,
  INT_TEST__USERNAME__CLIENT_ID,
  INT_TEST__USERNAME__SECRET_ID,
  INT_TEST__EMAIL__USERNAME,
  INT_TEST__EMAIL__PASSWORD,
  INT_TEST__EMAIL__POOL_ID,
  INT_TEST__EMAIL__CLIENT_ID,
  INT_TEST__EMAIL__SECRET_ID,
  INT_TEST__PHONE__USERNAME,
  INT_TEST__PHONE__PASSWORD,
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

const positiveCredentials = {
  username: {
    username: INT_TEST__USERNAME__USERNAME,
    password: INT_TEST__USERNAME__PASSWORD,
    poolId: INT_TEST__USERNAME__POOL_ID,
    clientId: INT_TEST__USERNAME__CLIENT_ID,
    secretId: INT_TEST__USERNAME__SECRET_ID,
  },
  email: {
    username: INT_TEST__EMAIL__USERNAME,
    password: INT_TEST__EMAIL__PASSWORD,
    poolId: INT_TEST__EMAIL__POOL_ID,
    clientId: INT_TEST__EMAIL__CLIENT_ID,
    secretId: INT_TEST__EMAIL__SECRET_ID,
  },
  phone: {
    username: INT_TEST__PHONE__USERNAME,
    password: INT_TEST__PHONE__PASSWORD,
    poolId: INT_TEST__PHONE__POOL_ID,
    clientId: INT_TEST__PHONE__CLIENT_ID,
    secretId: INT_TEST__PHONE__SECRET_ID,
  },
};

describe("SDK v2 integration", () => {
  const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  it("should work with standard client SRP auth flow (hashed password)", async () => {
    const { username, password, poolId, clientId, secretId } = positiveCredentials.username;
    const secretHash = createSecretHash(username, clientId, secretId);
    const passwordHash = createPasswordHash(username, password, poolId);
    const srpSession = createSrpSession(username, passwordHash, poolId);

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

  it("should work with standard admin SRP auth flow (hashed password)", async () => {
    const { username, password, poolId, clientId, secretId } = positiveCredentials.username;
    const secretHash = createSecretHash(username, clientId, secretId);
    const passwordHash = createPasswordHash(username, password, poolId);
    const srpSession = createSrpSession(username, passwordHash, poolId);

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

  it.each(Object.values(positiveCredentials))(
    "should work with standard client SRP auth flow (unhashed password): credentials %#",
    async ({ username, password, poolId, clientId, secretId }) => {
      const secretHash = createSecretHash(username, clientId, secretId);
      const srpSession = createSrpSession(username, password, poolId, false);

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
    },
  );

  it.each(Object.values(positiveCredentials))(
    "should work with standard admin SRP auth flow (unhashed password): credentials %#",
    async ({ username, password, poolId, clientId, secretId }) => {
      const secretHash = createSecretHash(username, clientId, secretId);
      const srpSession = createSrpSession(username, password, poolId, false);

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
    },
  );
});
