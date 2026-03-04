import { mockCredentialsFactory } from "@/__tests__/mocks/factories";
import { positiveCredentials } from "@/__tests__/test-cases";
import { createPasswordHash } from "@/cognito-srp-helper";

describe("createPasswordHash", () => {
  describe("positive", () => {
    it("should create the correct password hash", async () => {
      const { sub, password, poolId, passwordHash: expected } = mockCredentialsFactory();
      const hash = await createPasswordHash(sub, password, poolId);
      expect(hash).toEqual(expected);
    });

    it.each(Object.values(positiveCredentials))(
      "should create a password hash with the correct format: credentials %#",
      async (credentials) => {
        const { sub, password, poolId } = credentials;
        const hash = await createPasswordHash(sub, password, poolId);
        expect(hash).toMatch(/^[a-z0-9]{64}$/);
      },
    );
  });
});
