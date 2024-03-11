import { createPasswordHash } from "../../cognito-srp-helper";
import { mockCredentialsFactory } from "../mocks/factories";
import { positiveCredentials } from "../test-cases";

describe("createPasswordHash", () => {
  describe("positive", () => {
    it("should create the correct password hash", () => {
      const { sub, password, poolId, passwordHash: expected } = mockCredentialsFactory();
      const hash = createPasswordHash(sub, password, poolId);
      expect(hash).toEqual(expected);
    });

    it.each(Object.values(positiveCredentials))(
      "should create a password hash with the correct format: credentials %#",
      (credentials) => {
        const { sub, password, poolId } = credentials;
        const hash = createPasswordHash(sub, password, poolId);
        expect(hash).toMatch(/^[a-z0-9]{64}$/);
      },
    );
  });
});
