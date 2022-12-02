import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper";
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
      SRP_B: undefined,
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
      SALT: undefined,
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
      SECRET_BLOCK: undefined,
    },
  }),
  secretEmptyString: factories.mockInitiateAuthResponseFactory({
    ChallengeParameters: {
      SECRET_BLOCK: "",
    },
  }),
};

describe("createCognitoSession", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();

  describe("positive", () => {
    it.each(Object.entries(positiveInitiateAuthResponses))(
      "should produce cognito session values that match the required format: %p",
      (_, initiateAuthResponse) => {
        const cognitoSession =
          cognitoSrpHelper.createCognitoSession(initiateAuthResponse);
        expect(cognitoSession.largeB).toMatch(/[A-Fa-f0-9]+/);
        expect(cognitoSession.salt).toMatch(/^[A-Fa-f0-9]+$/);
        expect(cognitoSession.secret).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it("should produce the correct cognito session given default inputs", () => {
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory();
      const expectedCognitoSession =
        cognitoSrpHelper.createCognitoSession(initiateAuthResponse);
      const cognitoSession =
        cognitoSrpHelper.createCognitoSession(initiateAuthResponse);
      expect(cognitoSession).toEqual(expectedCognitoSession);
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
          cognitoSrpHelper.createCognitoSession(initiateAuthResponse);
        }).toThrow(
          ReferenceError(
            `Cognito session could not be initialised because ${falsyParameter} is missing or falsy`
          )
        );
      }
    );

    it("should throw a ReferenceError if initiateAuthResponse is undefined", () => {
      expect(() => {
        cognitoSrpHelper.createCognitoSession();
      }).toThrow(
        ReferenceError(
          "Cognito session could not be initialised because initiateAuthResponse is missing or falsy"
        )
      );
    });

    it("should throw a ReferenceError if initiateAuthResponse.ChallengeName is missing", () => {
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory();
      delete initiateAuthResponse.ChallengeName;

      expect(() => {
        cognitoSrpHelper.createCognitoSession(initiateAuthResponse);
      }).toThrow(
        ReferenceError(
          "Cognito session could not be initialised because initiateAuthResponse.ChallengeName is missing or falsy"
        )
      );
    });

    it("should throw a ReferenceError if initiateAuthResponse.ChallengeName is not 'PASSWORD_VERIFIER'", () => {
      expect(() => {
        cognitoSrpHelper.createCognitoSession(
          factories.mockInitiateAuthResponseFactory({
            ChallengeName: "INCORRECT_CHALLENGE_NAME",
          })
        );
      }).toThrow(
        ReferenceError(
          "Cognito session could not be initialised because initiateAuthResponse.ChallengeName is not PASSWORD_VERIFIER"
        )
      );
    });

    it("should throw a ReferenceError if initiateAuthResponse.ChallengeParameters is missing", () => {
      const initiateAuthResponse = factories.mockInitiateAuthResponseFactory();
      delete initiateAuthResponse.ChallengeParameters;

      expect(() => {
        cognitoSrpHelper.createCognitoSession(initiateAuthResponse);
      }).toThrow(
        ReferenceError(
          "Cognito session could not be initialised because initiateAuthResponse.ChallengeParameters is missing or falsy"
        )
      );
    });
  });
});
