import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper";
import {
  AbortOnZeroSrpErrorB,
  ErrorMessages,
  IncorrectCognitoChallengeError,
} from "../../exceptions";
import { InitiateAuthResponse } from "../../types";
import { factories, constants } from "../mocks";

const {
  defaultValues: { largeB: SRP_B, salt: SALT, secret: SECRET_BLOCK },
} = constants;

const positiveInitiateAuthResponses = {
  default: factories.mockInitiateAuthResponseFactory(),
  // SRP_B
  largeBLowerHex: factories.mockInitiateAuthResponseFactory({
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
  largeBUpperHex: factories.mockInitiateAuthResponseFactory({
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
  largeBMixedHex: factories.mockInitiateAuthResponseFactory({
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
  saltLowerHex: factories.mockInitiateAuthResponseFactory({
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
  saltUpperHex: factories.mockInitiateAuthResponseFactory({
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
  saltMixedHex: factories.mockInitiateAuthResponseFactory({
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
  secretSmall: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT,
      SECRET_BLOCK: new RandExp(/^[a-zA-Z0-9+=/]{5}$/).gen(),
    },
  }),
  secretLarge: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT,
      SECRET_BLOCK: new RandExp(/^[a-zA-Z0-9+=/]{4096}$/).gen(),
    },
  }),
};

const negativeInitiateAuthResponses = {
  initiateAuthResponseUndefined: undefined,
  challengeNameUndefined: factories.mockInitiateAuthResponseFactory({
    ChallengeName: undefined,
  }),
  challengeParametersUndefined: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: undefined,
  }),
  largeBUndefined: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      SALT,
      SECRET_BLOCK,
    },
  }),
  saltUndefined: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B,
      SALT: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      SECRET_BLOCK,
    },
  }),
  secretUndefined: factories.mockInitiateAuthResponseFactory({
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
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory();
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
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory({
        ChallengeName: "INCORRECT_CHALLENGE_NAME",
      });

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
      }).toThrow(
        new IncorrectCognitoChallengeError(initiateAuthResponse.ChallengeName)
      );
    });

    it("should throw a AbortOnZeroSrpErrorB if the generated server public key is 0", () => {
      const initiateAuthResponseSingleZero =
        factories.mockInitiateAuthResponseFactory({
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
      }).toThrow(new AbortOnZeroSrpErrorB());

      const initiateAuthResponseMultipleZeros =
        factories.mockInitiateAuthResponseFactory({
          ChallengeParameters: {
            SRP_B: "0000000000",
            SALT,
            SECRET_BLOCK,
          },
        });

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(
          initiateAuthResponseMultipleZeros
        );
      }).toThrow(new AbortOnZeroSrpErrorB());
    });
  });
});
