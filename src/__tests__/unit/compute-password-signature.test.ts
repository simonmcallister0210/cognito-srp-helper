import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper.js";
import { AbortOnZeroSrpUError, ErrorMessages } from "../../exceptions.js";
import { factories, constants } from "../mocks/index.js";
import * as utils from "../../utils.js";
import { ClientSrpSession, CognitoSrpSession } from "../../types.js";

const { mockClientSrpSessionFactory, mockCognitoSrpSessionFactory } = factories;

const positiveSrpSessions = {
  default: {
    clientSrpSession: mockClientSrpSessionFactory(),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: constants.defaultValues.timestamp,
  },
  // clientSrpSession
  randomUsername: {
    clientSrpSession: mockClientSrpSessionFactory({
      username: faker.internet.userName(),
    }),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: constants.defaultValues.timestamp,
  },
  randomPasswordHash: {
    clientSrpSession: mockClientSrpSessionFactory({
      passwordHash: faker.datatype.hexadecimal({
        case: "lower",
        length: 64,
        prefix: "",
      }),
    }),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: constants.defaultValues.timestamp,
  },
  randomPoolIdAbbr: {
    clientSrpSession: mockClientSrpSessionFactory({
      poolIdAbbr: new RandExp(/^[a-zA-Z0-9]{9}$/).gen(),
    }),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: constants.defaultValues.timestamp,
  },
  randomSmallA: {
    clientSrpSession: mockClientSrpSessionFactory({
      smallA: faker.datatype.hexadecimal({
        case: "lower",
        length: 16,
        prefix: "",
      }),
    }),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: constants.defaultValues.timestamp,
  },
  randomLargeA: {
    clientSrpSession: mockClientSrpSessionFactory({
      largeA: faker.datatype.hexadecimal({
        case: "lower",
        length: 1024,
        prefix: "",
      }),
    }),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: constants.defaultValues.timestamp,
  },
  // cognitoSrpSession
  randomLargeB: {
    clientSrpSession: mockClientSrpSessionFactory(),
    cognitoSrpSession: mockCognitoSrpSessionFactory({
      largeB: faker.datatype.hexadecimal({
        case: "lower",
        length: 1024,
        prefix: "",
      }),
    }),
    timestamp: constants.defaultValues.timestamp,
  },
  randomSalt: {
    clientSrpSession: mockClientSrpSessionFactory(),
    cognitoSrpSession: mockCognitoSrpSessionFactory({
      salt: faker.datatype.hexadecimal({
        case: "lower",
        length: 16,
        prefix: "",
      }),
    }),
    timestamp: constants.defaultValues.timestamp,
  },
  randomSecret: {
    clientSrpSession: mockClientSrpSessionFactory(),
    cognitoSrpSession: mockCognitoSrpSessionFactory({
      secret: new RandExp(/^[a-zA-Z0-9+=/]{2048}$/).gen(),
    }),
    timestamp: constants.defaultValues.timestamp,
  },
  // timestamp
  randomTimestamp: {
    clientSrpSession: mockClientSrpSessionFactory(),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: "Tue Feb 1 03:04:05 UTC 1234", // wrong
  },
};

const negativeSrpSessions = {
  clientSrpSessionUndefined: {
    clientSrpSession: undefined,
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: constants.defaultValues.timestamp,
  },
  cognitoSrpSessionUndefined: {
    clientSrpSession: mockClientSrpSessionFactory(),
    cognitoSrpSession: undefined,
    timestamp: constants.defaultValues.timestamp,
  },
  timestampUndefined: {
    clientSrpSession: mockClientSrpSessionFactory(),
    cognitoSrpSession: mockCognitoSrpSessionFactory(),
    timestamp: undefined,
  },
};

describe("computePasswordSignature", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();
  const { defaultValues } = constants;

  describe("positive", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it.each(Object.values(positiveSrpSessions))(
      "should produce a password signature that matches the required format: %#",
      (sessions) => {
        const { clientSrpSession, cognitoSrpSession, timestamp } = sessions;
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
        expect(passwordSignature).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it.each(
      faker.date.betweens(
        "0000-01-01T00:00:00.000Z",
        "9999-12-31T23:59:59.999Z",
        3
      )
    )(
      "should produce a password signature that matches the required format with date: %p",
      (date) => {
        jest.useFakeTimers().setSystemTime(new Date(date));
        const clientSrpSession = mockClientSrpSessionFactory();
        const cognitoSrpSession = mockCognitoSrpSessionFactory();
        const timestamp = cognitoSrpHelper.createTimestamp();
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
        expect(passwordSignature).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it.each(Object.values(omit(positiveSrpSessions, "default")))(
      "should not produce correct password signature if any session values are wrong: %#",
      (sessions) => {
        const { clientSrpSession, cognitoSrpSession, timestamp } = sessions;
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
        expect(passwordSignature).not.toEqual(defaultValues.passwordSignature);
      }
    );

    it("should produce the correct password signature given the set of pre-calculated default inputs", () => {
      const clientSrpSession = mockClientSrpSessionFactory();
      const cognitoSrpSession = mockCognitoSrpSessionFactory();
      const passwordSignature = cognitoSrpHelper.computePasswordSignature(
        clientSrpSession,
        cognitoSrpSession,
        defaultValues.timestamp
      );
      expect(passwordSignature).toEqual(defaultValues.passwordSignature);
    });
  });

  describe("negative", () => {
    it.each([
      [
        negativeSrpSessions.clientSrpSessionUndefined,
        ErrorMessages.UNDEF_CLIENT_SRP_SESSION,
      ],
      [
        negativeSrpSessions.cognitoSrpSessionUndefined,
        ErrorMessages.UNDEF_COGNITO_SRP_SESSION,
      ],
      [negativeSrpSessions.timestampUndefined, ErrorMessages.UNDEF_TIMESTAMP],
    ])(
      "should throw a ReferenceError if any sessions or timestamp are undefined: %#",
      (sessions, errorMessage) => {
        const { clientSrpSession, cognitoSrpSession, timestamp } = sessions;
        expect(() => {
          cognitoSrpHelper.computePasswordSignature(
            clientSrpSession as ClientSrpSession,
            cognitoSrpSession as CognitoSrpSession,
            timestamp as string
          );
        }).toThrow(new ReferenceError(errorMessage));
      }
    );

    it("should throw a AbortOnZeroSrpUError if the generated public key hash is 0", () => {
      const clientSrpSession = mockClientSrpSessionFactory();
      const cognitoSrpSession = mockCognitoSrpSessionFactory();
      const timestamp = cognitoSrpHelper.createTimestamp();

      // make sure our u = H(A, B) calculation returns 0
      jest.spyOn(utils, "hexHash").mockImplementationOnce(() => "0");
      expect(() => {
        cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
      }).toThrow(new AbortOnZeroSrpUError());

      // make sure our u = H(A, B) calculation returns 0
      jest.spyOn(utils, "hexHash").mockImplementationOnce(() => "0000000000");
      expect(() => {
        cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
      }).toThrow(new AbortOnZeroSrpUError());
    });
  });
});
