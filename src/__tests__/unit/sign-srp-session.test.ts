import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import { signSrpSession } from "../../cognito-srp-helper.js";
import {
  AbortOnZeroBSrpError,
  AbortOnZeroSrpError,
  AbortOnZeroUSrpError,
} from "../../errors.js";
import {
  mockInitiateAuthResponseFactory,
  mockSrpSessionFactory,
  mockSrpSessionSignedFactory,
} from "../mocks/factories.js";
import * as utils from "../../utils.js";

const { ChallengeParameters } = mockInitiateAuthResponseFactory();

const positiveSessions = {
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
  randomTimestamp: mockSrpSessionFactory({
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

const positiveInitiateAuthResponses = {
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
      SRP_B: faker.random.alphaNumeric(1, { casing: "lower" }),
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

describe("signSrpSession", () => {
  describe("positive", () => {
    it("should create the correct signed SRP session", () => {
      const session = mockSrpSessionFactory();
      const response = mockInitiateAuthResponseFactory();
      const sessionSigned = signSrpSession(session, response);
      const expected = mockSrpSessionSignedFactory();
      expect(sessionSigned).toEqual(expected);
    });

    it.each(Object.values(positiveSessions))(
      "should create a signed SRP session with the correct format: session %#",
      (session) => {
        const response = mockInitiateAuthResponseFactory();
        const sessionSigned = signSrpSession(session, response);
        const { SRP_B, SALT, SECRET_BLOCK } = response.ChallengeParameters;
        // previous session values should remain the same
        expect(sessionSigned.username).toMatch(session.username);
        expect(sessionSigned.passwordHash).toMatch(session.passwordHash);
        expect(sessionSigned.poolIdAbbr).toMatch(session.poolIdAbbr);
        expect(sessionSigned.timestamp).toMatch(session.timestamp);
        expect(sessionSigned.smallA).toMatch(session.smallA);
        expect(sessionSigned.largeA).toMatch(session.largeA);
        // response ChallengeParameters should remain the same
        expect(sessionSigned.largeB).toMatch(SRP_B);
        expect(sessionSigned.salt).toMatch(SALT);
        expect(sessionSigned.secret).toMatch(SECRET_BLOCK);
        // password signature should be new value with following format
        expect(sessionSigned.passwordSignature).toMatch(/^[A-Za-z0-9+=/]+$/);
      }
    );

    it.each(Object.values(positiveInitiateAuthResponses))(
      "should create a signed SRP session with the correct format: response %#",
      (response) => {
        const session = mockSrpSessionFactory();
        const sessionSigned = signSrpSession(session, response);
        const { SRP_B, SALT, SECRET_BLOCK } = response.ChallengeParameters;
        // previous session values should remain the same
        expect(sessionSigned.username).toMatch(session.username);
        expect(sessionSigned.passwordHash).toMatch(session.passwordHash);
        expect(sessionSigned.poolIdAbbr).toMatch(session.poolIdAbbr);
        expect(sessionSigned.timestamp).toMatch(session.timestamp);
        expect(sessionSigned.smallA).toMatch(session.smallA);
        expect(sessionSigned.largeA).toMatch(session.largeA);
        // response ChallengeParameters should remain the same
        expect(sessionSigned.largeB).toMatch(SRP_B);
        expect(sessionSigned.salt).toMatch(SALT);
        expect(sessionSigned.secret).toMatch(SECRET_BLOCK);
        // password signature should be new value with following format
        expect(sessionSigned.passwordSignature).toMatch(/^[A-Za-z0-9+=/]+$/);
      }
    );
  });

  describe("negative", () => {
    it("should throw a AbortOnZeroBSrpError if SRP B is 0", () => {
      const session = mockSrpSessionFactory();
      const responseShortZero = mockInitiateAuthResponseFactory({
        ChallengeParameters: {
          SRP_B: "0",
        },
      });
      const responseLongZero = mockInitiateAuthResponseFactory({
        ChallengeParameters: {
          SRP_B: "0000000000",
        },
      });

      // First check if the parent AbortOnZeroSrpError is thrown
      expect(() => {
        signSrpSession(session, responseShortZero);
      }).toThrow(AbortOnZeroSrpError);

      // Throw on single zero
      expect(() => {
        signSrpSession(session, responseShortZero);
      }).toThrow(AbortOnZeroBSrpError);

      // Throw on multiple zeros (because 0 = 000... in hexadecimal)
      expect(() => {
        signSrpSession(session, responseLongZero);
      }).toThrow(AbortOnZeroBSrpError);
    });

    it("should throw a AbortOnZeroUSrpError if SRP U is 0", () => {
      const session = mockSrpSessionFactory();
      const response = mockInitiateAuthResponseFactory();

      // make sure our u = H(A, B) calculation returns 0
      session;
      // First check if the parent AbortOnZeroSrpError is thrown
      jest.spyOn(utils, "hexHash").mockImplementationOnce(() => "0");
      expect(() => {
        signSrpSession(session, response);
      }).toThrow(AbortOnZeroSrpError);

      // Throw on single zero
      jest.spyOn(utils, "hexHash").mockImplementationOnce(() => "0");
      expect(() => {
        signSrpSession(session, response);
      }).toThrow(AbortOnZeroUSrpError);

      // Throw on multiple zeros (because 0 = 000... in hexadecimal)
      jest.spyOn(utils, "hexHash").mockImplementationOnce(() => "0000000000");
      expect(() => {
        signSrpSession(session, response);
      }).toThrow(AbortOnZeroUSrpError);
    });
  });
});
