import { createSecretHash } from "../../cognito-srp-helper.js";
import { positiveCredentials } from "../inputs/index.js";
import { mockCredentialsFactory } from "../mocks/factories.js";

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
