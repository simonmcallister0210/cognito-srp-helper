import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper";
import { AbortOnZeroSrpErrorU } from "../../exceptions";
import { factories, constants } from "../mocks";
import * as utils from "../../utils";

const positiveClientSrpSessions = {
  randomUsername: factories.mockClientSrpSessionFactory({
    username: faker.internet.userName(),
  }),
  randomPoolIdAbbr: factories.mockClientSrpSessionFactory({
    poolIdAbbr: new RandExp(/^[a-zA-Z0-9]{9}$/).gen(),
  }),
  randomPasswordHash: factories.mockClientSrpSessionFactory({
    passwordHash: faker.datatype.hexadecimal({
      case: "lower",
      length: 64,
      prefix: "",
    }),
  }),
  randomSmallA: factories.mockClientSrpSessionFactory({
    smallA: faker.datatype.hexadecimal({
      case: "lower",
      length: 16,
      prefix: "",
    }),
  }),
  randomLargeA: factories.mockClientSrpSessionFactory({
    largeA: faker.datatype.hexadecimal({
      case: "lower",
      length: 1024,
      prefix: "",
    }),
  }),
};

const positiveCognitoSrpSessions = {
  randomLargeB: factories.mockCognitoSrpSessionFactory({
    largeB: faker.datatype.hexadecimal({
      case: "lower",
      length: 1024,
      prefix: "",
    }),
  }),
  randomSalt: factories.mockCognitoSrpSessionFactory({
    salt: faker.datatype.hexadecimal({
      case: "lower",
      length: 16,
      prefix: "",
    }),
  }),
  randomSecret: factories.mockCognitoSrpSessionFactory({
    secret: new RandExp(/^[a-zA-Z0-9+=/]{2048}$/).gen(),
  }),
};

describe("computePasswordSignature", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();
  const { defaultValues } = constants;

  describe("positive", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it.each(Object.entries(positiveClientSrpSessions))(
      "should produce a password signature that matches the required format with client SRP session: %p",
      (_, clientSrpSession) => {
        const cognitoSrpSession = factories.mockCognitoSrpSessionFactory();
        const { timestamp } = defaultValues;
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
        expect(passwordSignature).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it.each(Object.entries(positiveCognitoSrpSessions))(
      "should produce a password signature that matches the required format with cognito SRP session: %p",
      (_, cognitoSrpSession) => {
        const clientSrpSession = factories.mockClientSrpSessionFactory();
        const { timestamp } = defaultValues;
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
        const clientSrpSession = factories.mockClientSrpSessionFactory();
        const cognitoSrpSession = factories.mockCognitoSrpSessionFactory();
        const timestamp = cognitoSrpHelper.createTimestamp();
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
        expect(passwordSignature).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it("should produce the correct password signature given the set of pre-calculated default inputs", () => {
      const clientSrpSession = factories.mockClientSrpSessionFactory();
      const cognitoSrpSession = factories.mockCognitoSrpSessionFactory();
      const passwordSignature = cognitoSrpHelper.computePasswordSignature(
        clientSrpSession,
        cognitoSrpSession,
        defaultValues.timestamp
      );
      expect(passwordSignature).toEqual(defaultValues.passwordSignature);
    });

    it.each(Object.entries(positiveClientSrpSessions))(
      "should not produce correct password signature if any clientSrpSession values are wrong: %p",
      (_, clientSrpSession) => {
        const cognitoSrpSession = factories.mockCognitoSrpSessionFactory();
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          defaultValues.timestamp
        );
        expect(passwordSignature).not.toEqual(defaultValues.passwordSignature);
      }
    );

    it.each(Object.entries(positiveCognitoSrpSessions))(
      "should not produce correct password signature if any cognitoSrpSession values are wrong: %p",
      (_, cognitoSrpSession) => {
        const clientSrpSession = factories.mockClientSrpSessionFactory();
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          defaultValues.timestamp
        );
        expect(passwordSignature).not.toEqual(defaultValues.passwordSignature);
      }
    );

    it("should not produce correct password signature if timestamp is wrong", () => {
      const clientSrpSession = factories.mockClientSrpSessionFactory();
      const cognitoSrpSession = factories.mockCognitoSrpSessionFactory();
      const passwordSignature = cognitoSrpHelper.computePasswordSignature(
        clientSrpSession,
        cognitoSrpSession,
        "Tue Feb 1 03:04:05 UTC 1234" // wrong
      );
      expect(passwordSignature).not.toEqual(defaultValues.passwordSignature);
    });
  });

  describe("negative", () => {
    it("should throw a AbortOnZeroSrpErrorU if the generated public key hash is 0", () => {
      const clientSrpSession = factories.mockClientSrpSessionFactory();
      const cognitoSrpSession = factories.mockCognitoSrpSessionFactory();
      const timestamp = cognitoSrpHelper.createTimestamp();

      // make sure our u = H(A, B) calculation returns 0
      jest.spyOn(utils, "hexHash").mockImplementationOnce(() => "0");
      expect(() => {
        cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
      }).toThrow(new AbortOnZeroSrpErrorU());

      // make sure our u = H(A, B) calculation returns 0
      jest.spyOn(utils, "hexHash").mockImplementationOnce(() => "0000000000");
      expect(() => {
        cognitoSrpHelper.computePasswordSignature(
          clientSrpSession,
          cognitoSrpSession,
          timestamp
        );
      }).toThrow(new AbortOnZeroSrpErrorU());
    });
  });
});
