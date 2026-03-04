import {
  mockDeviceVerifierFactory,
  mockInitiateAuthResponseWithNewDeviceFactory,
  mockRespondToAuthChallengeResponseFactory,
  mockSrpSessionFactory,
  mockSrpSessionSignedWithDeviceFactory,
} from "@/__tests__/mocks/factories";
import {
  negativeRespondToAuthChallengeResponses as negativeResponses,
  positiveRespondToAuthChallengeResponses as positiveResponses,
  positiveSrpSessionsSigned as positiveSessions,
} from "@/__tests__/test-cases";
import { signSrpSessionWithDevice } from "@/cognito-srp-helper";
import {
  AbortOnZeroBSrpError,
  AbortOnZeroSrpError,
  AbortOnZeroUSrpError,
  MissingChallengeResponsesError,
  MissingDeviceKeyError,
  MissingLargeBError,
  MissingSaltError,
  MissingSecretError,
  SignSrpSessionError,
} from "@/errors";
import * as utils from "@/utils";

const { ChallengeParameters } = mockRespondToAuthChallengeResponseFactory();

describe("signSrpSessionWithDevice", () => {
  describe("positive", () => {
    it("should create the correct signed SRP session", async () => {
      const session = mockSrpSessionFactory();
      const response = mockRespondToAuthChallengeResponseFactory();
      const { DeviceRandomPassword } = mockDeviceVerifierFactory();
      const { AuthenticationResult } = mockInitiateAuthResponseWithNewDeviceFactory();
      const DeviceGroupKey = AuthenticationResult?.NewDeviceMetadata?.DeviceGroupKey;
      if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

      const sessionSigned = await signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);

      const expected = mockSrpSessionSignedWithDeviceFactory();
      expect(sessionSigned).toEqual(expected);
    });

    it.each(Object.values(positiveSessions))(
      "should create a signed SRP session with the correct format: session %#",
      async (session) => {
        const response = mockRespondToAuthChallengeResponseFactory();
        const { SRP_B, SALT, SECRET_BLOCK } = response.ChallengeParameters ?? {};
        const { DeviceRandomPassword } = mockDeviceVerifierFactory();
        const { AuthenticationResult } = mockInitiateAuthResponseWithNewDeviceFactory();
        const DeviceGroupKey = AuthenticationResult?.NewDeviceMetadata?.DeviceGroupKey;
        if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

        const sessionSigned = await signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);

        // previous session values should remain the same
        expect(sessionSigned.username).toMatch(session.username);
        expect(sessionSigned.password).toMatch(session.password);
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
      async (response) => {
        const session = mockSrpSessionFactory();
        const { SRP_B, SALT, SECRET_BLOCK } = response.ChallengeParameters ?? {};
        const { DeviceRandomPassword } = mockDeviceVerifierFactory();
        const { AuthenticationResult } = mockInitiateAuthResponseWithNewDeviceFactory();
        const DeviceGroupKey = AuthenticationResult?.NewDeviceMetadata?.DeviceGroupKey;
        if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

        const sessionSigned = await signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);

        // previous session values should remain the same
        expect(sessionSigned.username).toMatch(session.username);
        expect(sessionSigned.password).toMatch(session.password);
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
    const { DeviceRandomPassword } = mockDeviceVerifierFactory();
    const { AuthenticationResult } = mockInitiateAuthResponseWithNewDeviceFactory();
    const DeviceGroupKey = AuthenticationResult?.NewDeviceMetadata?.DeviceGroupKey;
    if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

    it("should throw a AbortOnZeroBSrpError if SRP B is 0", async () => {
      const responseShortZero = mockRespondToAuthChallengeResponseFactory({
        ChallengeParameters: {
          ...ChallengeParameters,
          SRP_B: "0",
        },
      });
      const responseLongZero = mockRespondToAuthChallengeResponseFactory({
        ChallengeParameters: {
          ...ChallengeParameters,
          SRP_B: "0000000000",
        },
      });

      // First check if the parent AbortOnZeroSrpError is thrown
      await expect(() => {
        return signSrpSessionWithDevice(session, responseShortZero, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(AbortOnZeroSrpError);

      // Throw on single zero
      await expect(() => {
        return signSrpSessionWithDevice(session, responseShortZero, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(AbortOnZeroBSrpError);

      // Throw on multiple zeros (because 0 = 000... in hexadecimal)
      await expect(() => {
        return signSrpSessionWithDevice(session, responseLongZero, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(AbortOnZeroBSrpError);
    });

    it("should throw a AbortOnZeroUSrpError if SRP U is 0", async () => {
      const response = mockRespondToAuthChallengeResponseFactory();

      // make sure our u = H(A, B) calculation returns 0

      // First check if the parent AbortOnZeroSrpError is thrown
      jest.spyOn(utils, "hashHex").mockImplementationOnce(() => Promise.resolve("0"));
      await expect(() => {
        return signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(AbortOnZeroSrpError);

      // Throw on single zero
      jest.spyOn(utils, "hashHex").mockImplementationOnce(() => Promise.resolve("0"));
      await expect(() => {
        return signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(AbortOnZeroUSrpError);

      // Throw on multiple zeros (because 0 = 000... in hexadecimal)
      jest.spyOn(utils, "hashHex").mockImplementationOnce(() => Promise.resolve("0000000000"));
      await expect(() => {
        return signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(AbortOnZeroUSrpError);
    });

    it.each([
      [negativeResponses.challengeParametersUndefined, MissingChallengeResponsesError],
      [negativeResponses.challengeParametersOmitted, MissingChallengeResponsesError],
      [negativeResponses.saltOmitted, MissingSaltError],
      [negativeResponses.secretOmitted, MissingSecretError],
      [negativeResponses.largeBOmitted, MissingLargeBError],
      [negativeResponses.deviceKeyOmitted, MissingDeviceKeyError],
    ])("should throw a SignSrpSessionError: response %#", async (response, error) => {
      // First check if the parent SignSrpSessionError is thrown
      await expect(() => {
        return signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(SignSrpSessionError);

      // Throw specific SignSrpSessionError error
      await expect(() => {
        return signSrpSessionWithDevice(session, response, DeviceGroupKey, DeviceRandomPassword);
      }).rejects.toThrow(error);
    });
  });
});
