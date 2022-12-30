import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper";
import {
  AbortOnZeroSrpBError,
  ErrorMessages,
  IncorrectCognitoChallengeError,
} from "../../exceptions";
import { InitiateAuthResponse } from "../../types";
import { factories, constants } from "../mocks";

const { mockInitiateAuthResponseFactory } = factories;

const {
  defaultValues: { largeB: SRP_B, salt: SALT, secret: SECRET_BLOCK },
} = constants;

const positiveInitiateAuthResponses = {
  default: mockInitiateAuthResponseFactory(),
  // SRP_B
  largeBLowerHex: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B: faker.datatype.hexadecimal({
        case: "lower",
        length: 1024,
        prefix: "",
      }),
      SALT,
      SECRET_BLOCK,
    },
  }),
  largeBUpperHex: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B: faker.datatype.hexadecimal({
        case: "upper",
        length: 1024,
        prefix: "",
      }),
      SALT,
      SECRET_BLOCK,
    },
  }),
  largeBMixedHex: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B: faker.datatype.hexadecimal({
        case: "mixed",
        length: 1024,
        prefix: "",
      }),
      SALT,
      SECRET_BLOCK,
    },
  }),
  // SALT
  saltLowerHex: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT: faker.datatype.hexadecimal({
        case: "lower",
        length: 32,
        prefix: "",
      }),
      SECRET_BLOCK,
    },
  }),
  saltUpperHex: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT: faker.datatype.hexadecimal({
        case: "upper",
        length: 32,
        prefix: "",
      }),
      SECRET_BLOCK,
    },
  }),
  saltMixedHex: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT: faker.datatype.hexadecimal({
        case: "mixed",
        length: 32,
        prefix: "",
      }),
      SECRET_BLOCK,
    },
  }),
  // SECRET_BLOCK
  secretSmall: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT,
      SECRET_BLOCK: new RandExp(/^[a-zA-Z0-9+=/]{5}$/).gen(),
    },
  }),
  secretLarge: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT,
      SECRET_BLOCK: new RandExp(/^[a-zA-Z0-9+=/]{4096}$/).gen(),
    },
  }),
};

const negativeInitiateAuthResponses = {
  initiateAuthResponseUndefined: undefined,
  challengeNameUndefined: mockInitiateAuthResponseFactory({
    ChallengeName: undefined,
  }),
  challengeParametersUndefined: mockInitiateAuthResponseFactory({
    ChallengeParameters: undefined,
  }),
  largeBUndefined: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      SALT,
      SECRET_BLOCK,
    },
  }),
  saltUndefined: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      SECRET_BLOCK,
    },
  }),
  secretUndefined: mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT,
      SECRET_BLOCK: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  }),
};

describe("createCognitoSrpSession", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();

  describe("positive", () => {
    it.each(Object.values(positiveInitiateAuthResponses))(
      "should produce cognito SRP session values that match the required format: %#",
      (initiateAuthResponse) => {
        const cognitoSrpSession =
          cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
        expect(cognitoSrpSession.largeB).toMatch(/[A-Fa-f0-9]+/);
        expect(cognitoSrpSession.salt).toMatch(/^[A-Fa-f0-9]+$/);
        expect(cognitoSrpSession.secret).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it("should produce the correct cognito SRP session given default inputs", () => {
      const initiateAuthResponse = mockInitiateAuthResponseFactory();
      const expectedCognitoSrpSession =
        cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
      const cognitoSrpSession =
        cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
      expect(cognitoSrpSession).toEqual(expectedCognitoSrpSession);
    });
  });

  describe("negative", () => {
    it.each([
      [
        negativeInitiateAuthResponses.initiateAuthResponseUndefined,
        ErrorMessages.UNDEF_INIT_AUTH,
      ],
      [
        negativeInitiateAuthResponses.challengeNameUndefined,
        ErrorMessages.UNDEF_INIT_AUTH_CHALLENGE_NAME,
      ],
      [
        negativeInitiateAuthResponses.challengeParametersUndefined,
        ErrorMessages.UNDEF_INIT_AUTH_CHALLENGE_PARAMS,
      ],
      [
        negativeInitiateAuthResponses.largeBUndefined,
        ErrorMessages.UNDEF_SRP_B,
      ],
      [negativeInitiateAuthResponses.saltUndefined, ErrorMessages.UNDEF_SALT],
      [
        negativeInitiateAuthResponses.secretUndefined,
        ErrorMessages.UNDEF_SECRET_BLOCK,
      ],
    ])(
      "should throw ReferenceError if initiateAuthResponse, ChallengeName, or any ChallengeParameters are undefined: %#",
      (initiateAuthResponse, errorMessage) => {
        expect(() => {
          cognitoSrpHelper.createCognitoSrpSession(
            initiateAuthResponse as InitiateAuthResponse
          );
        }).toThrow(ReferenceError(errorMessage));
      }
    );

    it("should throw a IncorrectCognitoChallengeError if initiateAuthResponse.ChallengeName is not 'PASSWORD_VERIFIER'", () => {
      const initiateAuthResponse = mockInitiateAuthResponseFactory({
        ChallengeName: "INCORRECT_CHALLENGE_NAME",
      });

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
      }).toThrow(
        new IncorrectCognitoChallengeError(initiateAuthResponse.ChallengeName)
      );
    });

    it("should throw a AbortOnZeroSrpBError if the generated server public key is 0", () => {
      const initiateAuthResponseSingleZero = mockInitiateAuthResponseFactory({
        ChallengeParameters: {
          SRP_B: "0",
          SALT,
          SECRET_BLOCK,
        },
      });

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(
          initiateAuthResponseSingleZero
        );
      }).toThrow(new AbortOnZeroSrpBError());

      const initiateAuthResponseMultipleZeros = mockInitiateAuthResponseFactory(
        {
          ChallengeParameters: {
            SRP_B: "0000000000",
            SALT,
            SECRET_BLOCK,
          },
        }
      );

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(
          initiateAuthResponseMultipleZeros
        );
      }).toThrow(new AbortOnZeroSrpBError());
    });
  });
});
