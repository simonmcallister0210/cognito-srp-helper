import clonedeep from "lodash.clonedeep";

import { defaultValues } from "./constants";
import {
  ClientSrpSession,
  CognitoSrpSession,
  InitiateAuthResponse,
} from "../../types";

const {
  username,
  password,
  poolId,
  poolIdAbbr,
  passwordHash,
  smallA,
  largeA,
  largeB,
  salt,
  secret,
} = defaultValues;

const defaultMockCredentials = {
  username,
  password,
  poolId,
};

const defaultMockInitiateAuthResponse: InitiateAuthResponse = {
  ChallengeName: "PASSWORD_VERIFIER",
  ChallengeParameters: {
    SRP_B: largeB,
    SALT: salt,
    SECRET_BLOCK: secret,
  },
};

const defaultMockClientSrpSession: ClientSrpSession = {
  username,
  poolIdAbbr,
  passwordHash,
  smallA,
  largeA,
};

const defaultMockCognitoSrpSession: CognitoSrpSession = {
  largeB,
  salt,
  secret,
};

export const mockCredentialsFactory = (
  credentials?: Partial<typeof defaultMockCredentials>
) =>
  clonedeep({
    ...defaultMockCredentials,
    ...credentials,
  });

export const mockInitiateAuthResponseFactory = (
  initiateAuthResponse?: Partial<InitiateAuthResponse>
) =>
  clonedeep({
    ...defaultMockInitiateAuthResponse,
    ...initiateAuthResponse,
  });

export const mockClientSrpSessionFactory = (
  clientSrpSession?: Partial<ClientSrpSession>
) =>
  clonedeep({
    ...defaultMockClientSrpSession,
    ...clientSrpSession,
  });

export const mockCognitoSrpSessionFactory = (
  cognitoSrpSession?: Partial<CognitoSrpSession>
) =>
  clonedeep({
    ...defaultMockCognitoSrpSession,
    ...cognitoSrpSession,
  });
