import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { wrapAuthChallenge } from "../../cognito-srp-helper.js";
import {
  mockRespondToAuthChallengeRequestFactory,
  mockSrpSessionSignedFactory,
} from "../mocks/factories.js";
import {
  RespondToAuthChallengeRequest,
  SrpSessionSigned,
} from "../../types.js";

const { ChallengeResponses } = mockRespondToAuthChallengeRequestFactory();

const positiveSessions: Record<string, SrpSessionSigned> = {
  default: mockSrpSessionSignedFactory(),
  // username
  usernameTypical: mockSrpSessionSignedFactory({
    username: faker.internet.userName(),
  }),
  usernameEmail: mockSrpSessionSignedFactory({
    username: faker.internet.email(),
  }),
  usernameEmailSpecialChars: mockSrpSessionSignedFactory({
    username: faker.internet.email("john", "doe", "example.fakerjs.dev", {
      allowSpecialCharacters: true,
    }),
  }),
  usernameUuid: mockSrpSessionSignedFactory({
    username: faker.datatype.uuid(),
  }),
  usernameSymbols: mockSrpSessionSignedFactory({
    username: faker.datatype.string(),
  }),
  usernameEmpty: mockSrpSessionSignedFactory({
    username: "",
  }),
  // passwordHash
  passwordHashRandom: mockSrpSessionSignedFactory({
    passwordHash: faker.random.alphaNumeric(64, { casing: "lower" }),
  }),
  passwordHashEmpty: mockSrpSessionSignedFactory({
    passwordHash: "",
  }),
  // poolIdAbbr
  poolIdAbbrRandom: mockSrpSessionSignedFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  poolIdAbbrEmpty: mockSrpSessionSignedFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  // timestamp
  timestampRandom: mockSrpSessionSignedFactory({
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
  timestampWideHour: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 2000",
  }),
  timestampZeroMidnight: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 00:04:05 UTC 2000",
  }),
  timestampTwentyFourMidnight: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 24:04:05 UTC 2000",
  }),
  timestampNarrowYear: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 0",
  }),
  timestampWideYear: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 9999999999",
  }),
  // smallA
  smallARandom: mockSrpSessionSignedFactory({
    smallA: faker.random.alphaNumeric(256, { casing: "lower" }),
  }),
  smallAShort: mockSrpSessionSignedFactory({
    smallA: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  smallALong: mockSrpSessionSignedFactory({
    smallA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // largeA
  largeARandom: mockSrpSessionSignedFactory({
    largeA: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  largeAShort: mockSrpSessionSignedFactory({
    largeA: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  largeALong: mockSrpSessionSignedFactory({
    largeA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // largeB
  largeBRandom: mockSrpSessionSignedFactory({
    largeB: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  largeBShort: mockSrpSessionSignedFactory({
    largeB: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  largeBLarge: mockSrpSessionSignedFactory({
    largeB: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // salt
  saltRandom: mockSrpSessionSignedFactory({
    salt: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  saltShort: mockSrpSessionSignedFactory({
    salt: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  saltLong: mockSrpSessionSignedFactory({
    salt: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // secret
  secretRandom: mockSrpSessionSignedFactory({
    secret: new RandExp(/^[A-Za-z0-9+=/]{1724}$/).gen(),
  }),
  secretShort: mockSrpSessionSignedFactory({
    secret: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
  }),
  secretLong: mockSrpSessionSignedFactory({
    secret: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
  }),
  // passwordSignature
  passwordSignatureRandom: mockSrpSessionSignedFactory({
    passwordSignature: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
  }),
  passwordSignatureShort: mockSrpSessionSignedFactory({
    passwordSignature: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
  }),
  passwordSignatureLong: mockSrpSessionSignedFactory({
    passwordSignature: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
  }),
};

const positiveRequests: Record<string, RespondToAuthChallengeRequest> = {
  default: mockRespondToAuthChallengeRequestFactory(),
  // ChallengeName
  challengeNamePasswordVerifier: mockRespondToAuthChallengeRequestFactory({
    ChallengeName: "PASSWORD_VERIFIER",
  }),
  challengeNameUnknown: mockRespondToAuthChallengeRequestFactory({
    ChallengeName: "UNKNOWN",
  }),
  // ClientId
  clientIdRandom: mockRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdShort: mockRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(1, { casing: "mixed" }),
  }),
  clientIdLong: mockRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(10000, { casing: "mixed" }),
  }),
  // ChallengeResponses
  challengeResponsesOmitted: omit(
    mockRespondToAuthChallengeRequestFactory(),
    "ChallengeResponses"
  ),
  // SECRET_HASH
  secretHashRandom: mockRespondToAuthChallengeRequestFactory({
    ChallengeResponses: {
      ...ChallengeResponses,
      SECRET_HASH: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
    },
  }),
  secretHashOmitted: mockRespondToAuthChallengeRequestFactory({
    ChallengeResponses: {
      ...omit(ChallengeResponses, "SECRET_HASH"),
    },
  }),
  // USERNAME
  // ... needs to match session.username
};

describe("wrapAuthChallenge", () => {
  describe("positive", () => {
    it.each(Object.values(positiveSessions))(
      "should create the correct RespondToAuthChallengeRequest: session %#",
      (session) => {
        const request = mockRespondToAuthChallengeRequestFactory();
        const srpRequest = wrapAuthChallenge(session, request);
        expect(srpRequest).toMatchObject<RespondToAuthChallengeRequest>({
          ...request,
          ChallengeResponses: {
            ...request.ChallengeResponses,
            PASSWORD_CLAIM_SECRET_BLOCK: session.secret,
            PASSWORD_CLAIM_SIGNATURE: session.passwordSignature,
            TIMESTAMP: session.timestamp,
          },
        });
      }
    );

    it.each(Object.values(positiveRequests))(
      "should create the correct RespondToAuthChallengeRequest: request %#",
      (request) => {
        const session = mockSrpSessionSignedFactory();
        const srpRequest = wrapAuthChallenge(session, request);
        expect(srpRequest).toMatchObject<RespondToAuthChallengeRequest>({
          ...request,
          ChallengeResponses: {
            ...request.ChallengeResponses,
            PASSWORD_CLAIM_SECRET_BLOCK: session.secret,
            PASSWORD_CLAIM_SIGNATURE: session.passwordSignature,
            TIMESTAMP: session.timestamp,
          },
        });
      }
    );
  });
});
