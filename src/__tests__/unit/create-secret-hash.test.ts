import { mockCredentialsFactory } from "@/__tests__/mocks/factories";
import { positiveCredentials } from "@/__tests__/test-cases";
import { createSecretHash } from "@/cognito-srp-helper";

describe("createSecretHash", () => {
  describe("positive", () => {
    it("should create the correct secret hash", async () => {
      const { sub, clientId, secretId, secretHash: expected } = mockCredentialsFactory();
      const hash = await createSecretHash(sub, clientId, secretId);
      expect(hash).toEqual(expected);
    });

    it.each(Object.values(positiveCredentials))(
      "should create a secret hash with the correct format: credentials %#",
      async (credentials) => {
        const { sub, clientId, secretId } = credentials;
        const hash = await createSecretHash(sub, clientId, secretId);
        expect(hash).toMatch(/^[a-zA-Z0-9+=/]+$/);
      },
    );
  });
});
