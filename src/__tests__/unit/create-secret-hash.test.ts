import { faker } from "@faker-js/faker";

import { createSecretHash } from "../../cognito-srp-helper.js";
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
  // clientId
  clientIdRandom: mockCredentialsFactory({
    clientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdEmpty: mockCredentialsFactory({
    clientId: "",
  }),
  // secretId
  secretIdRandom: mockCredentialsFactory({
    clientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  secretIdEmpty: mockCredentialsFactory({
    clientId: "",
  }),
};

describe("createSecretHash", () => {
  describe("positive", () => {
    it("should create the correct secret hash", () => {
      const credentials = mockCredentialsFactory();
      const {
        username,
        clientId,
        secretId,
        secretHash: expected,
      } = credentials;
      const secretHash = createSecretHash(username, clientId, secretId);
      expect(secretHash).toEqual(expected);
    });

    it.each(Object.values(positiveCredentials))(
      "should create a secret hash with the correct format: credentials %#",
      (credentials) => {
        const { username, clientId, secretId } = credentials;
        const secretHash = createSecretHash(username, clientId, secretId);
        expect(secretHash).toMatch(/^[a-zA-Z0-9+=/]+$/);
      }
    );
  });
});
