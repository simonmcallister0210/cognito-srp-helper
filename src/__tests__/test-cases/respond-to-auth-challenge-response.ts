import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { RespondToAuthChallengeResponse } from "../../types";
import { mockRespondToAuthChallengeResponseFactory } from "../mocks/factories";

const { ChallengeParameters } = mockRespondToAuthChallengeResponseFactory();

export const positiveRespondToAuthChallengeResponses: Record<string, RespondToAuthChallengeResponse> = {
  default: mockRespondToAuthChallengeResponseFactory(),
  // ChallengeName
  challengeNamePasswordVerifier: mockRespondToAuthChallengeResponseFactory({
    ChallengeName: "PASSWORD_VERIFIER",
  }),
  challengeNameUnknown: mockRespondToAuthChallengeResponseFactory({
    ChallengeName: "UNKNOWN",
  }),
  // SALT
  saltRandom: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(32, { casing: "lower" }),
    },
  }),
  saltShort: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(1, { casing: "lower" }),
    },
  }),
  saltLong: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(10000, { casing: "lower" }),
    },
  }),
  // SECRET_BLOCK
  secretRandom: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{1724}$/).gen(),
    },
  }),
  secretShort: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
    },
  }),
  secretLong: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
    },
  }),
  // SRP_B
  largeBRandom: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SRP_B: faker.random.alphaNumeric(1024, { casing: "lower" }),
    },
  }),
  largeBShort: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      // 1 / 62 chance to return "0" which will trigger a AbortOnZeroBSrpError, so ban the char
      SRP_B: faker.random.alphaNumeric(1, { casing: "lower", bannedChars: "0" }),
    },
  }),
  largeBLong: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SRP_B: faker.random.alphaNumeric(10000, { casing: "lower" }),
    },
  }),
  // DEVICE_KEY
  deviceKeyRandom: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      DEVICE_KEY:
        new RandExp(/^(us(-gov)?|ap|ca|cn|eu|sa)-(central|(north|south)?(east|west)?)_$/).gen() + faker.datatype.uuid(),
    },
  }),
  // USERNAME
  usernameTypical: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      USERNAME: faker.internet.userName(),
    },
  }),
  usernameEmail: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      USERNAME: faker.internet.email(),
    },
  }),
  usernameEmailSpecialChars: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      USERNAME: faker.internet.email("john", "doe", "example.fakerjs.dev", {
        allowSpecialCharacters: true,
      }),
    },
  }),
  usernamePhone: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      USERNAME: faker.phone.number(),
    },
  }),
  usernameUuid: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      USERNAME: faker.datatype.uuid(),
    },
  }),
  usernameSymbols: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      USERNAME: faker.datatype.string(),
    },
  }),
  usernameEmpty: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      USERNAME: "",
    },
  }),
};

export const negativeRespondToAuthChallengeResponses: Record<string, RespondToAuthChallengeResponse> = {
  // ChallengeParameters
  challengeParametersUndefined: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: undefined,
  }),
  challengeParametersOmitted: omit(mockRespondToAuthChallengeResponseFactory(), "ChallengeParameters"),
  // SALT
  saltOmitted: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SALT"),
    },
  }),
  // SECRET_BLOCK
  secretOmitted: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SECRET_BLOCK"),
    },
  }),
  // SRP_B
  largeBOmitted: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SRP_B"),
    },
  }),
  // DEVICE_KEY
  deviceKeyOmitted: mockRespondToAuthChallengeResponseFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "DEVICE_KEY"),
    },
  }),
};
