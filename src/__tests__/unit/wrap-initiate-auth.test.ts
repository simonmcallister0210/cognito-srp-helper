import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { wrapInitiateAuth } from "../../cognito-srp-helper.js";
import {
  mockInitiateAuthRequestFactory,
  mockSrpSessionFactory,
} from "../mocks/factories.js";
import { InitiateAuthRequest, SrpSession } from "../../types.js";

const { AuthParameters } = mockInitiateAuthRequestFactory();

const positiveSessions: Record<string, SrpSession> = {
  default: mockSrpSessionFactory(),
  // username
  usernameTypical: mockSrpSessionFactory({
    username: faker.internet.userName(),
  }),
  usernameEmail: mockSrpSessionFactory({
    username: faker.internet.email(),
  }),
  usernameEmailSpecialChars: mockSrpSessionFactory({
    username: faker.internet.email("john", "doe", "example.fakerjs.dev", {
      allowSpecialCharacters: true,
    }),
  }),
  usernameUuid: mockSrpSessionFactory({
    username: faker.datatype.uuid(),
  }),
  usernameSymbols: mockSrpSessionFactory({
    username: faker.datatype.string(),
  }),
  usernameEmpty: mockSrpSessionFactory({
    username: "",
  }),
  // passwordHash
  passwordHashRandom: mockSrpSessionFactory({
    passwordHash: faker.random.alphaNumeric(64, { casing: "lower" }),
  }),
  passwordHashEmpty: mockSrpSessionFactory({
    passwordHash: "",
  }),
  // poolIdAbbr
  poolIdAbbrRandom: mockSrpSessionFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  poolIdAbbrEmpty: mockSrpSessionFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  // timestamp
  timestampRandom: mockSrpSessionFactory({
    timestamp: `
      ${faker.date.weekday({ abbr: true })}
      ${faker.date.month({ abbr: true })}
      ${faker.datatype.number({ min: 1, max: 31 })}
      ${faker.datatype
        .number({ min: 0, max: 23 })
        .toString()
        .padStart(2, "0")}:\
      ${faker.datatype
        .number({ min: 0, max: 59 })
        .toString()
        .padStart(2, "0")}:\
      ${faker.datatype.number({ min: 0, max: 59 }).toString().padStart(2, "0")}
      UTC
      ${faker.datatype.number({ min: 0, max: 9999 })}
    `,
  }),
  timestampWideHour: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 2000",
  }),
  timestampZeroMidnight: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 00:04:05 UTC 2000",
  }),
  timestampTwentyFourMidnight: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 24:04:05 UTC 2000",
  }),
  timestampNarrowYear: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 0",
  }),
  timestampWideYear: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 9999999999",
  }),
  // smallA
  smallARandom: mockSrpSessionFactory({
    smallA: faker.random.alphaNumeric(256, { casing: "lower" }),
  }),
  smallAShort: mockSrpSessionFactory({
    smallA: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  smallALong: mockSrpSessionFactory({
    smallA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // largeA
  largeARandom: mockSrpSessionFactory({
    largeA: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  largeAShort: mockSrpSessionFactory({
    largeA: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  largeALong: mockSrpSessionFactory({
    largeA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
};

const positiveRequests: Record<string, InitiateAuthRequest> = {
  default: mockInitiateAuthRequestFactory(),
  // AuthFlow
  authFlowUserSrpAuth: mockInitiateAuthRequestFactory({
    AuthFlow: "USER_SRP_AUTH",
  }),
  authFlowCustomAuth: mockInitiateAuthRequestFactory({
    AuthFlow: "CUSTOM_AUTH",
  }),
  authFlowUnknown: mockInitiateAuthRequestFactory({
    AuthFlow: "UNKNOWN",
  }),
  // ClientId
  clientIdRandom: mockInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdShort: mockInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(1, { casing: "mixed" }),
  }),
  clientIdLong: mockInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(10000, { casing: "mixed" }),
  }),
  // AuthParameters
  authParametersOmitted: omit(
    mockInitiateAuthRequestFactory(),
    "AuthParameters"
  ),
  // CHALLENGE_NAME
  challengeNameSrpA: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      ChallengeName: "SRP_A",
    },
  }),
  challengeNameUnknown: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      ChallengeName: "UNKNOWN",
    },
  }),
  // SECRET_HASH
  secretHashRandom: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      SECRET_HASH: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
    },
  }),
  secretHashOmitted: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...omit(AuthParameters, "SECRET_HASH"),
    },
  }),
  // USERNAME
  // ... needs to match session.username
};

describe("wrapInitiateAuth", () => {
  describe("positive", () => {
    it.each(Object.values(positiveSessions))(
      "should create the correct InitiateAuthRequest: session %#",
      (session) => {
        const request = mockInitiateAuthRequestFactory();
        const srpRequest = wrapInitiateAuth(session, request);
        expect(srpRequest).toMatchObject<InitiateAuthRequest>({
          ...request,
          AuthParameters: {
            ...request.AuthParameters,
            SRP_A: session.largeA,
          },
        });
      }
    );

    it.each(Object.values(positiveRequests))(
      "should create the correct InitiateAuthRequest: request %#",
      (request) => {
        const session = mockSrpSessionFactory();
        const srpRequest = wrapInitiateAuth(session, request);
        expect(srpRequest).toMatchObject<InitiateAuthRequest>({
          ...request,
          AuthParameters: {
            ...request.AuthParameters,
            SRP_A: session.largeA,
          },
        });
      }
    );
  });
});
