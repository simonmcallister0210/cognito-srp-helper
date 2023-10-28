import { createPasswordHash } from "../../cognito-srp-helper";
import { mockCredentialsFactory } from "../mocks/factories";
import { positiveCredentials } from "../test-cases";

describe("createPasswordHash", () => {
  describe("positive", () => {
    it("should create the correct password hash", () => {
      const credentials = mockCredentialsFactory();
      const { username, password, poolId, passwordHash: expected } = credentials;
      const passwordHash = createPasswordHash(username, password, poolId);
      expect(passwordHash).toEqual(expected);
    });

    it.each(Object.values(positiveCredentials))(
      "should create a password hash with the correct format: credentials %#",
      (credentials) => {
        const { username, password, poolId } = credentials;
        const passwordHash = createPasswordHash(username, password, poolId);
        expect(passwordHash).toMatch(/^[a-z0-9]{64}$/);
      },
    );
  });
});
