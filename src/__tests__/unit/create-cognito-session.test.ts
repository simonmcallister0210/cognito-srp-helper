import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper";
import { AbortOnZeroSrpErrorB } from "../../exceptions";
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
  // SRP_B
  largeBUndefined: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  }),
  largeBEmptyString: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SRP_B: "",
    },
  }),
  // SALT
  saltUndefined: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SALT: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  }),
  saltEmptyString: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SALT: "",
    },
  }),
  // SECRET_BLOCK
  secretUndefined: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SECRET_BLOCK: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  }),
  secretEmptyString: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SECRET_BLOCK: "",
    },
  }),
};

describe("createCognitoSrpSession", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();

  describe("positive", () => {
    it.each(Object.entries(positiveInitiateAuthResponses))(
      "should produce cognito SRP session values that match the required format: %p",
      (_, initiateAuthResponse) => {
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
    it.each(Object.entries(negativeInitiateAuthResponses))(
      "should throw ReferenceError if any ChallengeParameters are falsy: %p",
      (_, initiateAuthResponse) => {
        const challengeParameters = initiateAuthResponse.ChallengeParameters;
        if (!challengeParameters)
          throw new ReferenceError(
            "initiateAuthResponse.ChallengeParameters is undefined"
          );
        const { SRP_B, SALT, SECRET_BLOCK } = challengeParameters;
        const falsyParameter = !SRP_B
          ? "SRP_B"
          : !SALT
          ? "SALT"
          : !SECRET_BLOCK
          ? "SECRET_BLOCK"
          : "";

        expect(() => {
          cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
        }).toThrow(
          ReferenceError(
            `Cognito SRP session could not be initialised because ${falsyParameter} is missing or falsy`
          )
        );
      }
    );

    it("should throw a ReferenceError if initiateAuthResponse is undefined", () => {
      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession();
      }).toThrow(
        ReferenceError(
          "Cognito SRP session could not be initialised because initiateAuthResponse is missing or falsy"
        )
      );
    });

    it("should throw a ReferenceError if initiateAuthResponse.ChallengeName is missing", () => {
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory();
      delete initiateAuthResponse.ChallengeName;

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
      }).toThrow(
        ReferenceError(
          "Cognito SRP session could not be initialised because initiateAuthResponse.ChallengeName is missing or falsy"
        )
      );
    });

    it("should throw a ReferenceError if initiateAuthResponse.ChallengeName is not 'PASSWORD_VERIFIER'", () => {
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory({
        ChallengeName: "INCORRECT_CHALLENGE_NAME",
      });

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
      }).toThrow(
        ReferenceError(
          "Cognito SRP session could not be initialised because initiateAuthResponse.ChallengeName is not PASSWORD_VERIFIER"
        )
      );
    });

    it("should throw a ReferenceError if initiateAuthResponse.ChallengeParameters is missing", () => {
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory();
      delete initiateAuthResponse.ChallengeParameters;

      expect(() => {
        cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);
      }).toThrow(
        ReferenceError(
          "Cognito SRP session could not be initialised because initiateAuthResponse.ChallengeParameters is missing or falsy"
        )
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
