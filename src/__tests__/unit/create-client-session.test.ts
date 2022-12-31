import { faker } from "@faker-js/faker";
import { BigInteger } from "jsbn";
import RandExp from "randexp";

import { CognitoSrpHelper } from "../../index.js";
import { AbortOnZeroSrpAError, ErrorMessages } from "../../exceptions.js";
import { factories, constants } from "../mocks/index.js";

const { mockCredentialsFactory } = factories;

const positiveCredentials = {
  default: mockCredentialsFactory(),
  // username
  usernameTypical: mockCredentialsFactory({
    username: faker.internet.userName(),
  }),
  usernameEmail: mockCredentialsFactory({
    username: faker.internet.email(),
  }),
  usernameEmailSpecialChars: mockCredentialsFactory({
    username: faker.internet.email("john", "doe", "example.fakerjs.dev", {
      allowSpecialCharacters: true,
    }),
  }),
  usernameUuid: mockCredentialsFactory({
    username: faker.datatype.uuid(),
  }),
  usernameSymbols: mockCredentialsFactory({
    username: faker.datatype.string(),
  }),
  usernameEmpty: mockCredentialsFactory({
    username: "",
  }),
  // password
  passwordMemorable: mockCredentialsFactory({
    password: faker.internet.password(20, true),
  }),
  passwordUnmemorable: mockCredentialsFactory({
    password: faker.internet.password(20, false),
  }),
  passwordSymbols: mockCredentialsFactory({
    password: faker.datatype.string(),
  }),
  passwordEmpty: mockCredentialsFactory({
    password: "",
  }),
  // poolId
  poolIdRandom: mockCredentialsFactory({
    poolId: new RandExp(
      /^(us(-gov)?|ap|ca|cn|eu|sa)-(central|(north|south)?(east|west)?)_[a-zA-Z0-9]{9}$/
    ).gen(),
  }),
  poolIdEmpty: mockCredentialsFactory({
    poolId: "",
  }),
};

const negativeCredentials = {
  // username
  usernameUndefined: mockCredentialsFactory({
    username: undefined,
  }),
  passwordUndefined: mockCredentialsFactory({
    password: undefined,
  }),
  poolIdUndefined: mockCredentialsFactory({
    poolId: undefined,
  }),
};

describe("createClientSrpSession", () => {
  const cognitoSrpHelper = new CognitoSrpHelper();
  const { defaultValues } = constants;

  describe("positive", () => {
    it.each(Object.values(positiveCredentials))(
      "should produce client SRP session values that match the required format: %#",
      (credentials) => {
        const { username, password, poolId } = credentials;
        const clientSrpSession = cognitoSrpHelper.createClientSrpSession(
          username,
          password,
          poolId
        );
        expect(clientSrpSession.username).toEqual(username);
        expect(clientSrpSession.poolIdAbbr).toEqual(poolId.split("_")[1]);
        expect(clientSrpSession.passwordHash).toMatch(/[A-Fa-f0-9]{64}/);
        expect(clientSrpSession.smallA).toMatch(/^[A-Fa-f0-9]+$/);
        expect(clientSrpSession.largeA).toMatch(/^[A-Fa-f0-9]+$/);
      }
    );

    it("should produce the correct client SRP session given default inputs", () => {
      // use default values for deterministic output
      jest.useFakeTimers().setSystemTime(new Date(defaultValues.date));
      jest
        .spyOn(
          CognitoSrpHelper.prototype as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          "generateSmallA"
        )
        .mockImplementationOnce(() => new BigInteger(defaultValues.smallA, 16));

      const credentials = mockCredentialsFactory();
      const { username, password, poolId } = credentials;
      const clientSrpSession = cognitoSrpHelper.createClientSrpSession(
        username,
        password,
        poolId
      );
      const expectedClientSrpSession = factories.mockClientSrpSessionFactory();
      expect(clientSrpSession).toEqual(expectedClientSrpSession);

      jest.useRealTimers();
    });

    it("should not produce the same client SRP session on successive calls", () => {
      const credentials = mockCredentialsFactory();
      const { username, password, poolId } = credentials;
      const clientSrpSession1 = cognitoSrpHelper.createClientSrpSession(
        username,
        password,
        poolId
      );
      const clientSrpSession2 = cognitoSrpHelper.createClientSrpSession(
        username,
        password,
        poolId
      );
      expect(clientSrpSession1).not.toEqual(clientSrpSession2);
    });
  });

  describe("negative", () => {
    it.each([
      [negativeCredentials.usernameUndefined, ErrorMessages.UNDEF_USERNAME],
      [negativeCredentials.passwordUndefined, ErrorMessages.UNDEF_PASSWORD],
      [negativeCredentials.poolIdUndefined, ErrorMessages.UNDEF_POOLID],
    ])(
      "should throw a ReferenceError if any credential values are undefined: %#",
      (credentials, errorMessage) => {
        const { username, password, poolId } = credentials;
        expect(() => {
          cognitoSrpHelper.createClientSrpSession(
            username as string,
            password as string,
            poolId as string
          );
        }).toThrow(new ReferenceError(errorMessage));
      }
    );

    it("should throw a AbortOnZeroSrpAError if the generated client public key is 0", () => {
      // make sure our A = G % a ^ N calculation returns 0
      jest
        .spyOn(
          BigInteger.prototype as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          "modPow"
        )
        .mockImplementationOnce(() => new BigInteger("0", 16));

      const credentials = mockCredentialsFactory();
      const { username, password, poolId } = credentials;
      expect(() => {
        cognitoSrpHelper.createClientSrpSession(username, password, poolId);
      }).toThrow(new AbortOnZeroSrpAError());
    });
  });
});
