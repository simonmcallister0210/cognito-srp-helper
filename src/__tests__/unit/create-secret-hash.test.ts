import { createSecretHash } from "../../cognito-srp-helper";
import { mockCredentialsFactory } from "../mocks/factories";
import { positiveCredentials } from "../test-cases";

describe("createSecretHash", () => {
  describe("positive", () => {
    it("should create the correct secret hash", () => {
      const { sub, clientId, secretId, secretHash: expected } = mockCredentialsFactory();
      const hash = createSecretHash(sub, clientId, secretId);
      expect(hash).toEqual(expected);
    });

    it.each(Object.values(positiveCredentials))(
      "should create a secret hash with the correct format: credentials %#",
      (credentials) => {
        const { sub, clientId, secretId } = credentials;
        const hash = createSecretHash(sub, clientId, secretId);
        expect(hash).toMatch(/^[a-zA-Z0-9+=/]+$/);
      },
    );
  });
});
