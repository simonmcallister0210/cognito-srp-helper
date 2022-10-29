import { BigInteger } from "jsbn";

import CognitoSrpHelper from "../cognito-srp-helper";
import { ClientSession, ServerSession } from "../types";

// Client credentials
const USERNAME = "username";
const POOL_ID = "region_123456";
const POOL_ID_NUMBER = "123456";
const PASSWORD = "password";
const PASSWORD_HASH =
  "cbe3fab1fb0777b94dcecabfd1fe0f7b81f0b149653ad8f48777f464d8328fd3";

// Fixed values for when we want output to be deterministic
const SMALL_A = new BigInteger("abcdef", 16);
const LARGE_A = new BigInteger(
  "e77795671bb953820871b1bb1060d3c4633cb8038970499149be98f02d14775c1d2fa030b033a04b681092c9295cae0f9cc59a2b427e4847eaa5df2db1af2a21f6b1f18789322de94e0389d834a4a232c83d1121f631c920d8699f74cd484f7750e991bbf05086e2542dc7a7728ce0b9a37e2a1383a7451fe5c2b0dea93aae608418cb66dc0154af53bf9188c5ecaac40b53dff29f4ed1f5d07e196bb6baf301deb518495c6fb9efe0b9dcf6c98da5b9a547eef82bde73d4b70cd50ecefd3c4c0b0addd48009837a4e867c7c9c22dc2f49134522e5c3cada6d8b5b68b2e97a4fb26fc2f45b55d490ed687e84b9022811a779667307d2cdb2d4a3a7585900c14b66abfb659fa20d8ca87cf27852a4d89ed8985fb52dded77c719a42561e13ae0a5261e927041f7a47526a59ad67931243007a27cc116661e7149be1d006c8712293c38170ee8486244799b14e06946fdd0d42ba060b83ebca9da8f8632daa62208c832d53806625d050b8b1cee9b3c2770117d1be0cb948320a2fcc1bc1f7f899",
  16
);
const TIMESTAMP = "Sun Oct 23 17:02:22 UTC 2022";

// Server values (generated with the above client credentials, and b = 123456)
const SALT = "1234567890abcdef";
const SECRET = "secret";
const LARGE_B =
  "38964bd8b8d8a178fe983f0a184f7bf574b7650dddae5c28e65593471d1d4cdec34cb8939da30f510adc155af488720943d00c2c035678cf71c423024260ff298d740f90980225d451a71bc1c2fc0470cf607eeb0e650c2d3a99a85b89251172d1be77e791ebaa0df1769f9dc428f3aac5ada6fdd48be67714dec364a539e8cca38fcca440c3da5d365d4dda215eedf592a42ad2d40be9608cb34728dc896119e7f5bbcb9e97e62afc40e10a2aaffbd8de4a8e6b6e525af9bff792ff0fa5b42852af2bf6dd9fcca6b09fefa73ef3ec08f55e3abf3a7ea039b6a9da9e9fcf4c42329546cd9793fd6236d56e08e93f5085b6cbeb364140af8700bc75de8ff15b1a21a952cf752dd823aa2b5d31d0914dbabc5e0c37c80c15dea0242b3848be60276c77e8036a93f445f053429d4968ff6c02ff720f604ae31c455f049e407b2e227960a85e055658445d6288c3a5aff5ec2dde317fff6031828441dd735c3d0caa9cd5972c2c3f5f585fa6fdf35127cfd179c9789de0bfda95b198dee194f4e6284ae1220163cc3072c015c94471ce173f5def81faa48a95078b4b4b4348b95bc9";

// given the above inputs, this is the correct signature the server is expecting
const PASSWORD_SIGNATURE = "kwIHDQhgaEvhSiRrKwMluwp5M/+sk2r6ttDlwrYAQuQ=";

describe("SrpAuthenticationHelper", () => {
  const srpAuthenticationHelper = new CognitoSrpHelper();

  describe("createClientSession", () => {
    it("should produce the correct client session", () => {
      // Give indeterministic functions deterministic output
      jest
        .spyOn(
          CognitoSrpHelper.prototype as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          "generateSmallA"
        )
        .mockImplementationOnce(() => SMALL_A);
      jest
        .spyOn(
          CognitoSrpHelper.prototype as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          "getCognitoTimeStamp"
        )
        .mockImplementationOnce(() => TIMESTAMP);

      const clientSession = srpAuthenticationHelper.createClientSession(
        USERNAME,
        PASSWORD,
        POOL_ID
      );
      const expected: ClientSession = {
        largeA: LARGE_A.toString(16),
        passwordHash: PASSWORD_HASH,
        poolId: POOL_ID_NUMBER,
        smallA: SMALL_A.toString(16),
        timestamp: TIMESTAMP,
        username: USERNAME,
      };
      expect(clientSession).toEqual(expected);
    });

    it("should not produce the same client session on successive calls", () => {
      const clientSession1 = srpAuthenticationHelper.createClientSession(
        USERNAME,
        PASSWORD,
        POOL_ID
      );
      const clientSession2 = srpAuthenticationHelper.createClientSession(
        USERNAME,
        PASSWORD,
        POOL_ID
      );
      expect(clientSession1).not.toEqual(clientSession2);
    });

    it("should produce session values that conform to the format required by Cognito", () => {
      const clientSession = srpAuthenticationHelper.createClientSession(
        USERNAME,
        PASSWORD,
        POOL_ID
      );
      expect(clientSession.passwordHash).toMatch(/[A-Fa-f0-9]/);
      expect(clientSession.smallA).toMatch(/[A-Fa-f0-9]{16}/);
      expect(clientSession.largeA).toMatch(/[A-Fa-f0-9]{64}/);
      expect(clientSession.timestamp).toMatch(
        /(Sun|Mon|Tue|Wed|Thu|Fri|Sat){1} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec){1} [1-3]?[0-9] [0-9]{2}:[0-9]{2}:[0-9]{2} UTC [0-9]{4}/
      );
    });

    it("should throw ReferenceError if any parameters are falsy", () => {
      expect(() => {
        srpAuthenticationHelper.createClientSession(
          undefined,
          undefined,
          undefined
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createClientSession(
          USERNAME,
          undefined,
          undefined
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createClientSession(
          undefined,
          PASSWORD,
          undefined
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createClientSession(
          undefined,
          undefined,
          POOL_ID
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createClientSession(
          USERNAME,
          PASSWORD,
          undefined
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createClientSession(
          undefined,
          PASSWORD,
          POOL_ID
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createClientSession(
          USERNAME,
          undefined,
          POOL_ID
        );
      }).toThrow(ReferenceError);
    });
  });

  describe("createServerSession", () => {
    it("should produce the correct server session", () => {
      const clientSession = srpAuthenticationHelper.createServerSession(
        LARGE_B,
        SALT,
        SECRET
      );
      const expected: ServerSession = {
        largeB: LARGE_B,
        salt: SALT,
        secret: SECRET,
      };
      expect(clientSession).toEqual(expected);
    });

    it("should throw ReferenceError if any parameters are falsy", () => {
      expect(() => {
        srpAuthenticationHelper.createServerSession(
          undefined,
          undefined,
          undefined
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createServerSession(
          LARGE_B,
          undefined,
          undefined
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createServerSession(undefined, SALT, undefined);
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createServerSession(
          undefined,
          undefined,
          SECRET
        );
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createServerSession(LARGE_B, SALT, undefined);
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createServerSession(undefined, SALT, SECRET);
      }).toThrow(ReferenceError);
      expect(() => {
        srpAuthenticationHelper.createServerSession(LARGE_B, undefined, SECRET);
      }).toThrow(ReferenceError);
    });
  });

  describe("computePasswordSignature", () => {
    beforeAll(() => {
      // Give indeterministic functions deterministic output
      jest
        .spyOn(
          CognitoSrpHelper.prototype as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          "generateSmallA"
        )
        .mockImplementation(() => SMALL_A);
      jest
        .spyOn(
          CognitoSrpHelper.prototype as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          "getCognitoTimeStamp"
        )
        .mockImplementation(() => TIMESTAMP);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it("should produce the correct password signature", () => {
      const clientSession = srpAuthenticationHelper.createClientSession(
        USERNAME,
        PASSWORD,
        POOL_ID
      );
      const serverSession = srpAuthenticationHelper.createServerSession(
        LARGE_B,
        SALT,
        SECRET
      );
      const passwordSignature =
        srpAuthenticationHelper.computePasswordSignature(
          clientSession,
          serverSession
        );
      expect(passwordSignature).toEqual(PASSWORD_SIGNATURE);
    });

    it("should not produce the correct password signature if any client session parameters are wrong", () => {
      const clientSessionWrongUsername =
        srpAuthenticationHelper.createClientSession(
          "wrong_username",
          PASSWORD,
          POOL_ID
        );
      const clientSessionWrongPassword =
        srpAuthenticationHelper.createClientSession(
          USERNAME,
          "wrong_password",
          POOL_ID
        );
      const clientSessionWrongPoolId =
        srpAuthenticationHelper.createClientSession(
          USERNAME,
          PASSWORD,
          "wrong_poolid"
        );
      const serverSession = srpAuthenticationHelper.createServerSession(
        LARGE_B,
        SALT,
        SECRET
      );
      const passwordSignatureWrongUsername =
        srpAuthenticationHelper.computePasswordSignature(
          clientSessionWrongUsername,
          serverSession
        );
      const passwordSignatureWrongPassword =
        srpAuthenticationHelper.computePasswordSignature(
          clientSessionWrongPassword,
          serverSession
        );
      const passwordSignatureWrongPoolId =
        srpAuthenticationHelper.computePasswordSignature(
          clientSessionWrongPoolId,
          serverSession
        );
      expect(passwordSignatureWrongUsername).not.toEqual(PASSWORD_SIGNATURE);
      expect(passwordSignatureWrongPassword).not.toEqual(PASSWORD_SIGNATURE);
      expect(passwordSignatureWrongPoolId).not.toEqual(PASSWORD_SIGNATURE);
    });

    it("should not produce the correct password signature if any server session parameters are wrong", () => {
      const clientSession = srpAuthenticationHelper.createClientSession(
        USERNAME,
        PASSWORD,
        POOL_ID
      );
      const serverSessionWrongLargeB =
        srpAuthenticationHelper.createServerSession(
          "abcdef1234567890",
          SALT,
          SECRET
        );
      const serverSessionWrongSalt =
        srpAuthenticationHelper.createServerSession(
          LARGE_B,
          "abcdef1234567890",
          SECRET
        );
      const serverSessionWrongSecret =
        srpAuthenticationHelper.createServerSession(
          LARGE_B,
          SALT,
          "abcdef1234567890"
        );
      const passwordSignatureWrongLargeB =
        srpAuthenticationHelper.computePasswordSignature(
          clientSession,
          serverSessionWrongLargeB
        );
      const passwordSignatureWrongSalt =
        srpAuthenticationHelper.computePasswordSignature(
          clientSession,
          serverSessionWrongSalt
        );
      const passwordSignatureWrongSecret =
        srpAuthenticationHelper.computePasswordSignature(
          clientSession,
          serverSessionWrongSecret
        );
      expect(passwordSignatureWrongLargeB).not.toEqual(PASSWORD_SIGNATURE);
      expect(passwordSignatureWrongSalt).not.toEqual(PASSWORD_SIGNATURE);
      expect(passwordSignatureWrongSecret).not.toEqual(PASSWORD_SIGNATURE);
    });
  });
});
