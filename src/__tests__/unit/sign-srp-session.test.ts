import { signSrpSession } from "../../cognito-srp-helper.js";
import {
  AbortOnZeroBSrpError,
  AbortOnZeroSrpError,
  AbortOnZeroUSrpError,
  MissingChallengeResponsesError,
  MissingLargeBError,
  MissingSaltError,
  MissingSecretError,
  SignSrpSessionError,
} from "../../errors.js";
import * as utils from "../../utils.js";
import {
  mockInitiateAuthResponseFactory,
  mockSrpSessionFactory,
  mockSrpSessionSignedFactory,
} from "../mocks/factories.js";
import {
  negativeInitiateAuthResponses as negativeResponses,
  positiveInitiateAuthResponses as positiveResponses,
  positiveSrpSessions as positiveSessions,
} from "../test-cases/index.js";

const { ChallengeParameters } = mockInitiateAuthResponseFactory();

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
        const { SRP_B, SALT, SECRET_BLOCK } = response.ChallengeParameters ?? {};
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
      },
    );

    it.each(Object.values(positiveResponses))(
      "should create a signed SRP session with the correct format: response %#",
      (response) => {
        const session = mockSrpSessionFactory();
        const sessionSigned = signSrpSession(session, response);
        const { SRP_B, SALT, SECRET_BLOCK } = response.ChallengeParameters ?? {};
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
      },
    );
  });

  describe("negative", () => {
    const session = mockSrpSessionFactory();

    it("should throw a AbortOnZeroBSrpError if SRP B is 0", () => {
      const responseShortZero = mockInitiateAuthResponseFactory({
        ChallengeParameters: {
          ...ChallengeParameters,
          SRP_B: "0",
        },
      });
      const responseLongZero = mockInitiateAuthResponseFactory({
        ChallengeParameters: {
          ...ChallengeParameters,
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
      const response = mockInitiateAuthResponseFactory();

      // make sure our u = H(A, B) calculation returns 0

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

    it.each([
      [negativeResponses.challengeParametersUndefined, MissingChallengeResponsesError],
      [negativeResponses.challengeParametersOmitted, MissingChallengeResponsesError],
      [negativeResponses.saltOmitted, MissingSaltError],
      [negativeResponses.secretOmitted, MissingSecretError],
      [negativeResponses.largeBOmitted, MissingLargeBError],
    ])("should throw a SignSrpSessionError: response %#", (response, error) => {
      // First check if the parent SignSrpSessionError is thrown
      expect(() => {
        signSrpSession(session, response);
      }).toThrow(SignSrpSessionError);

      // Throw specific SignSrpSessionError error
      expect(() => {
        signSrpSession(session, response);
      }).toThrow(error);
    });
  });
});
