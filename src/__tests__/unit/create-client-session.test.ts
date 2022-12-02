import { faker } from "@faker-js/faker";
import { BigInteger } from "jsbn";
import RandExp from "randexp";

import CognitoSrpHelper from "../../cognito-srp-helper";
import { factories, constants } from "../mocks";

const positiveCredentials = {
  default: factories.mockCredentialsFactory(),
  // username
  usernameTypical: factories.mockCredentialsFactory({
    username: faker.internet.userName(),
  }),
  usernameEmail: factories.mockCredentialsFactory({
    username: faker.internet.email(),
  }),
  usernameEmailSpecialChars: factories.mockCredentialsFactory({
    username: faker.internet.email("john", "doe", "example.fakerjs.dev", {
      allowSpecialCharacters: true,
    }),
  }),
  usernameUuid: factories.mockCredentialsFactory({
    username: faker.datatype.uuid(),
  }),
  usernameSymbols: factories.mockCredentialsFactory({
    username: faker.datatype.string(),
  }),
  // password
  passwordMemorable: factories.mockCredentialsFactory({
    password: faker.internet.password(20, true),
  }),
  passwordUnmemorable: factories.mockCredentialsFactory({
    password: faker.internet.password(20, false),
  }),
  passwordSymbols: factories.mockCredentialsFactory({
    password: faker.datatype.string(),
  }),
  // poolId
  poolIdRandom: factories.mockCredentialsFactory({
    poolId: new RandExp(
      /^(us(-gov)?|ap|ca|cn|eu|sa)-(central|(north|south)?(east|west)?)_[a-zA-Z0-9]{9}$/
    ).gen(),
  }),
};

const negativeCredentials = {
  // username
  usernameUndefined: factories.mockCredentialsFactory({
    username: undefined,
  }),
  usernameEmptyString: factories.mockCredentialsFactory({
    username: "",
  }),
  // password
  passwordUndefined: factories.mockCredentialsFactory({
    password: undefined,
  }),
  passwordEmptyString: factories.mockCredentialsFactory({
    password: "",
  }),
  // poolId
  poolIdUndefined: factories.mockCredentialsFactory({
    poolId: undefined,
  }),
  poolIdEmptyString: factories.mockCredentialsFactory({
    poolId: "",
  }),
};

describe("createClientSession", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();
  const { defaultValues } = constants;

  describe("positive", () => {
    it.each(Object.entries(positiveCredentials))(
      "should produce client session values that match the required format: %p",
      (_, credentials) => {
        const clientSession = cognitoSrpHelper.createClientSession(credentials);
        expect(clientSession.username).toEqual(credentials.username);
        expect(clientSession.poolIdAbbr).toEqual(
          credentials.poolId.split("_")[1]
        );
        expect(clientSession.passwordHash).toMatch(/[A-Fa-f0-9]{64}/);
        expect(clientSession.smallA).toMatch(/^[A-Fa-f0-9]+$/);
        expect(clientSession.largeA).toMatch(/^[A-Fa-f0-9]+$/);
      }
    );

    it("should produce the correct client session given default inputs", () => {
      // use default values for deterministic output
      jest.useFakeTimers().setSystemTime(new Date(defaultValues.date));
      jest
        .spyOn(
          CognitoSrpHelper.prototype as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          "generateSmallA"
        )
        .mockImplementationOnce(() => new BigInteger(defaultValues.smallA, 16));

      const credentials = factories.mockCredentialsFactory();
      const expectedClientSession = factories.mockClientSessionFactory();
      const clientSession = cognitoSrpHelper.createClientSession(credentials);
      expect(clientSession).toEqual(expectedClientSession);

      jest.useRealTimers();
    });

    it("should not produce the same client session on successive calls", () => {
      const credentials = factories.mockCredentialsFactory();
      const clientSession1 = cognitoSrpHelper.createClientSession(credentials);
      const clientSession2 = cognitoSrpHelper.createClientSession(credentials);
      expect(clientSession1).not.toEqual(clientSession2);
    });
  });

  describe("negative", () => {
    it.each(Object.entries(negativeCredentials))(
      "should throw a ReferenceError if any credential values are falsy: %p",
      (_, credentials) => {
        const { username, password, poolId } = credentials;
        const falsyCredential = !username
          ? "username"
          : !password
          ? "password"
          : !poolId
          ? "poolId"
          : "";

        expect(() => {
          cognitoSrpHelper.createClientSession(credentials);
        }).toThrow(
          ReferenceError(
            `Client session could not be initialised because ${falsyCredential} is missing or falsy`
          )
        );
      }
    );
  });
});
