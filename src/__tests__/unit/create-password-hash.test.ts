import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import { createPasswordHash } from "../../cognito-srp-helper.js";
import { Credentials } from "../../types.js";
import { mockCredentialsFactory } from "../mocks/factories.js";

const positiveCredentials: Record<string, Credentials> = {
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

describe("createPasswordHash", () => {
  describe("positive", () => {
    it("should create the correct password hash", () => {
      const credentials = mockCredentialsFactory();
      const {
        username,
        password,
        poolId,
        passwordHash: expected,
      } = credentials;
      const passwordHash = createPasswordHash(username, password, poolId);
      expect(passwordHash).toEqual(expected);
    });

    it.each(Object.values(positiveCredentials))(
      "should create a password hash with the correct format: credentials %#",
      (credentials) => {
        const { username, password, poolId } = credentials;
        const passwordHash = createPasswordHash(username, password, poolId);
        expect(passwordHash).toMatch(/^[a-z0-9]{64}$/);
      }
    );
  });
});
