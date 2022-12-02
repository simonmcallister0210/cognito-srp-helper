import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper";
import { factories, constants } from "../mocks";

const positiveClientSessions = {
  randomUsername: factories.mockClientSessionFactory({
    username: faker.internet.userName(),
  }),
  randomPoolIdAbbr: factories.mockClientSessionFactory({
    poolIdAbbr: new RandExp(/^[a-zA-Z0-9]{9}$/).gen(),
  }),
  randomPasswordHash: factories.mockClientSessionFactory({
    passwordHash: faker.datatype.hexadecimal({
      case: "lower",
      length: 64,
      prefix: "",
    }),
  }),
  randomSmallA: factories.mockClientSessionFactory({
    smallA: faker.datatype.hexadecimal({
      case: "lower",
      length: 16,
      prefix: "",
    }),
  }),
  randomLargeA: factories.mockClientSessionFactory({
    largeA: faker.datatype.hexadecimal({
      case: "lower",
      length: 1024,
      prefix: "",
    }),
  }),
};

const positiveCognitoSessions = {
  randomLargeB: factories.mockCognitoSessionFactory({
    largeB: faker.datatype.hexadecimal({
      case: "lower",
      length: 1024,
      prefix: "",
    }),
  }),
  randomSalt: factories.mockCognitoSessionFactory({
    salt: faker.datatype.hexadecimal({
      case: "lower",
      length: 16,
      prefix: "",
    }),
  }),
  randomSecret: factories.mockCognitoSessionFactory({
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

    it.each(Object.entries(positiveClientSessions))(
      "should produce a password signature that matches the required format with client session: %p",
      (_, clientSession) => {
        const cognitoSession = factories.mockCognitoSessionFactory();
        const { timestamp } = defaultValues;
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSession,
          cognitoSession,
          timestamp
        );
        expect(passwordSignature).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it.each(Object.entries(positiveCognitoSessions))(
      "should produce a password signature that matches the required format with cognito session: %p",
      (_, cognitoSession) => {
        const clientSession = factories.mockClientSessionFactory();
        const { timestamp } = defaultValues;
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSession,
          cognitoSession,
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
        const clientSession = factories.mockClientSessionFactory();
        const cognitoSession = factories.mockCognitoSessionFactory();
        const timestamp = cognitoSrpHelper.createTimestamp();
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSession,
          cognitoSession,
          timestamp
        );
        expect(passwordSignature).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );

    it("should produce the correct password signature given the set of pre-calculated default inputs", () => {
      const clientSession = factories.mockClientSessionFactory();
      const cognitoSession = factories.mockCognitoSessionFactory();
      const passwordSignature = cognitoSrpHelper.computePasswordSignature(
        clientSession,
        cognitoSession,
        defaultValues.timestamp
      );
      expect(passwordSignature).toEqual(defaultValues.passwordSignature);
    });

    it.each(Object.entries(positiveClientSessions))(
      "should not produce correct password signature if any clientSession values are wrong: %p",
      (_, clientSession) => {
        const cognitoSession = factories.mockCognitoSessionFactory();
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSession,
          cognitoSession,
          defaultValues.timestamp
        );
        expect(passwordSignature).not.toEqual(defaultValues.passwordSignature);
      }
    );

    it.each(Object.entries(positiveCognitoSessions))(
      "should not produce correct password signature if any cognitoSession values are wrong: %p",
      (_, cognitoSession) => {
        const clientSession = factories.mockClientSessionFactory();
        const passwordSignature = cognitoSrpHelper.computePasswordSignature(
          clientSession,
          cognitoSession,
          defaultValues.timestamp
        );
        expect(passwordSignature).not.toEqual(defaultValues.passwordSignature);
      }
    );

    it("should not produce correct password signature if timestamp is wrong", () => {
      const clientSession = factories.mockClientSessionFactory();
      const cognitoSession = factories.mockCognitoSessionFactory();
      const passwordSignature = cognitoSrpHelper.computePasswordSignature(
        clientSession,
        cognitoSession,
        "Tue Feb 1 03:04:05 UTC 1234" // wrong
      );
      expect(passwordSignature).not.toEqual(defaultValues.passwordSignature);
    });
  });

  // describe("negative", () => {});
});
