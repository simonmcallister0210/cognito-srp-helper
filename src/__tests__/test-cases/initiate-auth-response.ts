import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { InitiateAuthResponse } from "../../types";
import { mockInitiateAuthResponseFactory } from "../mocks/factories";

const { ChallengeParameters } = mockInitiateAuthResponseFactory();

export const positiveInitiateAuthResponses: Record<string, InitiateAuthResponse> = {
  default: mockInitiateAuthResponseFactory(),
  // largeB
  largeBRandom: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SRP_B: faker.random.alphaNumeric(1024, { casing: "lower" }),
    },
  }),
  largeBShort: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      // 1 / 62 chance to return "0" which will trigger a AbortOnZeroBSrpError, so ban the char
      SRP_B: faker.random.alphaNumeric(1, { casing: "lower", bannedChars: "0" }),
    },
  }),
  largeBLong: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SRP_B: faker.random.alphaNumeric(10000, { casing: "lower" }),
    },
  }),
  // salt
  saltRandom: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(32, { casing: "lower" }),
    },
  }),
  saltShort: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(1, { casing: "lower" }),
    },
  }),
  saltLong: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(10000, { casing: "lower" }),
    },
  }),
  // secret
  secretRandom: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{1724}$/).gen(),
    },
  }),
  secretShort: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
    },
  }),
  secretLong: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
    },
  }),
};

export const negativeInitiateAuthResponses: Record<string, InitiateAuthResponse> = {
  default: mockInitiateAuthResponseFactory(),
  // ChallengeParameters
  challengeParametersUndefined: mockInitiateAuthResponseFactory({
    ChallengeParameters: undefined,
  }),
  challengeParametersOmitted: omit(mockInitiateAuthResponseFactory(), "ChallengeParameters"),
  // salt
  saltOmitted: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SALT"),
    },
  }),
  // secret
  secretOmitted: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SECRET_BLOCK"),
    },
  }),
  // largeB
  largeBOmitted: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SRP_B"),
    },
  }),
};
