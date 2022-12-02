import clonedeep from "lodash.clonedeep";

import { defaultValues } from "./constants";
import {
  ClientSession,
  CognitoSession,
  Credentials,
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

const defaultMockCredentials: Credentials = {
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

const defaultMockClientSession: ClientSession = {
  username,
  poolIdAbbr,
  passwordHash,
  smallA,
  largeA,
};

const defaultMockCognitoSession: CognitoSession = {
  largeB,
  salt,
  secret,
};

export const mockCredentialsFactory = (
  credentials?: Partial<Credentials>
): Credentials =>
  clonedeep({
    ...defaultMockCredentials,
    ...credentials,
  });

export const mockInitiateAuthResponseFactory = (
  initiateAuthResponse?: Partial<InitiateAuthResponse>
): InitiateAuthResponse =>
  clonedeep({
    ...defaultMockInitiateAuthResponse,
    ...initiateAuthResponse,
  });

export const mockClientSessionFactory = (
  clientSession?: Partial<ClientSession>
): ClientSession =>
  clonedeep({
    ...defaultMockClientSession,
    ...clientSession,
  });

export const mockCognitoSessionFactory = (
  cognitoSession?: Partial<CognitoSession>
): CognitoSession =>
  clonedeep({
    ...defaultMockCognitoSession,
    ...cognitoSession,
  });
