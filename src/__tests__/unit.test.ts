import { faker } from "@faker-js/faker";
import { BigInteger } from "jsbn";

import CognitoSrpHelper from "../cognito-srp-helper";
import { ClientSession, CognitoSession } from "../types";

// Client credentials
const USERNAME = "username";
const PASSWORD = "password";
const POOL_ID = "eu-west-2_bBpjKlyj6";
const POOL_ID_NUMBER = "bBpjKlyj6";
const PASSWORD_HASH =
  "266629fd96baf8f433a4f01562eea59dd99a721dac75ae600e06bc697b2016ff";

// Fixed values for when we want output to be deterministic
const SMALL_A = new BigInteger("abcdef0123456789", 16);
const LARGE_A = new BigInteger(
  "362be8c4c29e414549c30c6679ddbb556c27717d80c8feec68257bf5edcd855fbd23590841c1f792dd24a09243c00d4fbb8cc8047fbe1c95da7b467d29269d2db462c6268f10ef5a3c23f71865a54bae6e48523e6a7a9b65d115c66a2f5b4ec5b7384c9796dc6b2d422ea630e1821104ab05cb4a4f292f991d771be4fdba39bc6ff8dce0f0addaaaf172d908d08544d573a2222f1e198caf65f5e6445848ed23b5bbfff0b5bc00ca54b2831a200577220cfe4f5de20b66baffbfc8d3a16af6f6a7a590e0764ccdf918daf922df1ed0a695702c9bd63a69b09b4c2fb8a3bffee5f89744639607e1920ee006d81f09cba7682e75be5b407fb5cb1f706c0dbf7a9325b5c56ea53333ba1aecab647beae4b2b44c0912814609560fda8d86e6aff0b2317e339d2d3b422069d8e68fca8a39c43acb360d4285bb2dd076bb58b41e07be255f349537adaae3bf5260b2c7e066fb77904ebcee5005cc367f926482f9b405952f50e1182049ac49847a048fca4fbe13c6538eea38132c9bc43c9b05690bb7",
  16
);
const TIMESTAMP = "Tue Feb 1 03:04:05 UTC 2000";
const TIMESTAMP_EPOCH_MS = 949374245000;

// Cognito values (generated with the above client credentials, and b = 123456)
const SALT = "8f6a1dad94d7b82c5e3031d21a251b0f";
const SECRET =
  "F+iU1RhIMWd3K64Qg+J/eud+WYMsW1tDULDQ4boHjzgdNFiBSKFX3BvoMHZJ2MjKv6nKMRgjifbx5sjdrBi2n+Nat+9E1QD0rzeJ2l2oOeVXruiwItacGO5AjM9PU1sFtZu4N13oNbsx9DUY7diIB+ksKz8LjxJV4FP055O1OJzEGbSY+RHAw3d3HsY2xsE9Zy6bD5FpSrONwKZWWUpZXSexPiDHzGIcRyBBYXwOKAJ+1pCtZW/Jg+MuW6hiYfTMEGk8vr/35TmiAHjYRe1urxElaa+fJi41j1tpX5FhrHfNp3WmuVj6cWJwkhZ/GKGL000lwsXDEY83C2v2czpjP1VwyDf2UPxI1BNPMVjCWZx5V/9D5SniPUWCNpwyh+ZSCVvRJxQitMcV0klswY36itXXn7OCurUjgqViUIBPbrVDcbuZ49tR4UoHlQXNzsmzXwlGwyHvNUHjNAT/6/qAAtmHwJbT6GZzceN1g+33P0Eq2BIWxj16pnhPKykrGuvIV3TpcL9FY0CcTKqozRfC2pOWenT08md++uq39z9OP+wA/7Fjt1ceLOiDcRhEW0xhoBqu/3V7RDNDUqV2bLH7rEq7Q5PCGhsRu8h9crUbVtNOUrna/o7HmRy0XiBQdjLP7Xe6uASNZAAso4eUZce0oc2LIpHvAx6BK8cw8rp2Pcg+ZnC0HgcpBEF6sHJEcH4GmZNJ10c/exITniVKSJkP1C8iPqulNug6OMmSav3WpMvj/qb/t8JPNqbePj99fANkteG7JPUY9LoE/wsBDIeYEA4lZ4HvKZw9g8RbltYNmOQAa6K4XXI0AEspx1+TT5A+cJl48BPk+f46SCThCzK/8N9XHaerojUqu4EWW1l5c+WRaOCdvo/HQidTn1VQJ6lcyJwcuyoxy7MlESMfs1G9rgehHbYjWNxoUwX/AwFfNzS/7dMENhDFx+ZUsT0wgrn+iMhfJJPHG4lt0N/R6JjQ8IOgaUZ7CZdrL7pQxA5v0eqWwZ/cYJVAI+mGLez1ldYQRvZkw0dOkpCjCDrw7ZTKnsyRLDE6KyyNT+ykJq7aGyAHb5nxualN0B8OnqY1hh+tZ5xTOh9jlnvBo7dwfsbZpjsGGLiMLbc411cT+FUONrlPdK9wDEZdQ8jcys4PfeCzcju/VnNEbbv1EuxG5bIWGApSOVf04p2/0bBWn8VJkKoCsC9+QhV2KwTRfCLZWloYIc/N1QuzXf328m9FG3vihrXvkgcxxsSbUjMb4QhR7DkYIN6kWsguBOVTybdTi4vlNqFzX8bJtK3uQNKC98yYzZjR40HFOydBJjLckUandwu1blgqM3IwlmYWMiPcFx2SGQRIufq8hLOhyE12ulT9KI4c2D+yLn7hASICW/3z7LgfuWq6j1FDVlmSqM00C8wZ84DzT056HLETpWpl1Gh3QRJPkReqRKlY0Bqrk5koMfmRuGht/WnyXxs0gSAkWFOevpvYopyHBhMTdc7DlGE70QcRJiBeuJkKNOoih+lOkHGFof5xnFWzaZkuouBZFntSn4xZxEAb1Tl56k1b8oCIHLvrsnlqxMHfNYlnQUO+gnhFgDc6AlyQCtc6+wlulggchkPFMgjlaN/w6h3N9697ksRnySNMNAkCx+VgP+qbgn24pGYWWtlCWWpsdkxU6OzpFQwBchqBw9LUB5MyqjwWLssMxlJxg0KgXnRNfwv5jd0sAE5KvT4vFCt0FA==";
const LARGE_B =
  "a2a9be7148a622a87b92513959336c923ab748fdde47e1eae8e0b4495bfc950e65a4c2cf09ac9ab38c85dbc31100bda601bb44d03d8c8a47770cdace442bea4c30ac83df807c2d2dfd6d8b449178c4c558108d141bdd79f8695d40ce25d77b1d7715a53b0022782b71105710e476b484e7c01d9625eafe4d50aff1808712d4c2636a7bb83b008fb8f398d79c5dfe59074ee0df3240253e5719c18b343f49ef5d975d89e2c481628eadca30a90ab6c41d7b9308aa6f6fc618813393ace0f52562f51f26c3fc3160e9dc99f78e9bc22758eeb7f22c137a962de99a66feb7a23e179a599813c8431c364ee193b64eef9bca04117ceba50140bafe1a0aea262c0b9bcde235866da2f1c174063d685ad67f231fcef7dca62a327f6cf2279b5fa17383acd1868629d75523e87e14cdb214ea14ce6d47228e350e4d1d451a1238886d6b3dae1d59b79321ab740c995b28c6e03a61cf76383ce1906f86389927d3575e751cfe4ab50c1eef52dd79aee69512b88f237bd74d04e8cc72d0ab94c0ad934f26";

// given the above inputs, this is the correct signature that Cognito is expecting
const PASSWORD_SIGNATURE = "AmaS40dQC4mBIgVaKNkAvWpYBmHUi/gv/XKVVCr8xyE=";

describe("SrpAuthenticationHelper unit tests", () => {
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

    it.each([
      // 3 usernames
      ...Array.from({ length: 3 }, () => [
        faker.internet.userName(),
        faker.internet.password(),
        `eu-west-2_${faker.datatype.string(9)}`,
      ]),
      // 3 emails
      ...Array.from({ length: 3 }, () => [
        faker.internet.email(),
        faker.internet.password(),
        `${faker.datatype.string(9)}_${faker.datatype.string(9)}`,
      ]),
    ])(
      "should produce password hash that conform to the format required by Cognito, with credentials: %p %p %p",
      (username, password, poolId) => {
        const clientSession = srpAuthenticationHelper.createClientSession(
          username,
          password,
          poolId
        );
        expect(clientSession.passwordHash).toMatch(/[A-Fa-f0-9]{64}/);
      }
    );

    it.each([...Array(3).keys()])(
      "should produce session keys that conform to the format required by Cognito",
      () => {
        const clientSession = srpAuthenticationHelper.createClientSession(
          USERNAME,
          PASSWORD,
          POOL_ID
        );
        expect(clientSession.smallA).toMatch(/^[A-Fa-f0-9]+$/);
        expect(clientSession.largeA).toMatch(/^[A-Fa-f0-9]+$/);
      }
    );

    it.each([
      [undefined, undefined, undefined],
      [USERNAME, undefined, undefined],
      [undefined, PASSWORD, undefined],
      [undefined, undefined, POOL_ID],
      [USERNAME, PASSWORD, undefined],
      [undefined, PASSWORD, POOL_ID],
      [USERNAME, undefined, POOL_ID],
    ])(
      "should throw ReferenceError if any parameters are falsy",
      (username, password, poolId) => {
        expect(() => {
          srpAuthenticationHelper.createClientSession(
            username,
            password,
            poolId
          );
        }).toThrow(ReferenceError);
      }
    );
  });

  describe("createCognitoSession", () => {
    it("should produce the correct cognito session", () => {
      const clientSession = srpAuthenticationHelper.createCognitoSession(
        LARGE_B,
        SALT,
        SECRET
      );
      const expected: CognitoSession = {
        largeB: LARGE_B,
        salt: SALT,
        secret: SECRET,
      };
      expect(clientSession).toEqual(expected);
    });

    it.each([
      [undefined, undefined, undefined],
      [LARGE_B, undefined, undefined],
      [undefined, SALT, undefined],
      [undefined, undefined, SECRET],
      [LARGE_B, SALT, undefined],
      [undefined, SALT, SECRET],
      [LARGE_B, undefined, SECRET],
    ])(
      "should throw ReferenceError if any parameters are falsy",
      (largeB, salt, secret) => {
        expect(() => {
          srpAuthenticationHelper.createCognitoSession(largeB, salt, secret);
        }).toThrow(ReferenceError);
      }
    );
  });

  describe("createTimestamp", () => {
    it("should produce the correct timestamp", () => {
      jest.useFakeTimers().setSystemTime(new Date(TIMESTAMP_EPOCH_MS));

      const timestamp = srpAuthenticationHelper.createTimestamp();
      expect(timestamp).toEqual(TIMESTAMP);

      jest.useRealTimers();
    });

    it.each([
      "1000-01-01T01:02:03.000Z", // 'wide' hours
      "1000-01-01T24:00:00.000Z", // 24th hour
      "1000-01-01T00:00:00.000Z", // 0th hour
      ...faker.date.betweens(
        "1000-01-01T00:00:00.000Z",
        "9999-01-01T00:00:00.000Z",
        3
      ),
    ])(
      "should produce timestamps that conform to the format required by Cognito, with timestamp: %p",
      (epoch) => {
        jest.useFakeTimers().setSystemTime(new Date(epoch));

        const timestamp = srpAuthenticationHelper.createTimestamp();
        expect(timestamp).toMatch(
          /(Sun|Mon|Tue|Wed|Thu|Fri|Sat){1} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec){1} [1-3]?[0-9] (2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9]) UTC [0-9]{4}/
        );

        jest.useRealTimers();
      }
    );
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
      jest.useFakeTimers().setSystemTime(new Date(TIMESTAMP_EPOCH_MS));
    });

    afterAll(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
    });

    it("should produce the correct password signature", () => {
      const clientSession = srpAuthenticationHelper.createClientSession(
        USERNAME,
        PASSWORD,
        POOL_ID
      );
      const cognitoSession = srpAuthenticationHelper.createCognitoSession(
        LARGE_B,
        SALT,
        SECRET
      );
      const timestamp = srpAuthenticationHelper.createTimestamp();
      const passwordSignature =
        srpAuthenticationHelper.computePasswordSignature(
          clientSession,
          cognitoSession,
          timestamp
        );
      expect(passwordSignature).toEqual(PASSWORD_SIGNATURE);
    });

    it.each([
      ["wrong_username", PASSWORD, POOL_ID],
      [USERNAME, "wrong_password", POOL_ID],
      [USERNAME, PASSWORD, "wrong_poolid"],
      ["wrong_username", "wrong_password", POOL_ID],
      [USERNAME, "wrong_password", "wrong_poolid"],
      ["wrong_username", PASSWORD, "wrong_poolid"],
      ["wrong_username", "wrong_password", "wrong_poolid"],
    ])(
      "should not produce the correct password signature if any client session parameters are wrong, with client credentials: %p %p %p",
      (username, password, poolId) => {
        const clientSessionWrong = srpAuthenticationHelper.createClientSession(
          username,
          password,
          poolId
        );
        const cognitoSession = srpAuthenticationHelper.createCognitoSession(
          LARGE_B,
          SALT,
          SECRET
        );
        const timestamp = srpAuthenticationHelper.createTimestamp();
        const passwordSignature =
          srpAuthenticationHelper.computePasswordSignature(
            clientSessionWrong,
            cognitoSession,
            timestamp
          );
        expect(passwordSignature).not.toEqual(PASSWORD_SIGNATURE);
      }
    );

    it.each([
      ["1a79eb", SALT, SECRET],
      [LARGE_B, "5a17", SECRET],
      [LARGE_B, SALT, "5ec7e7"],
      ["1a79eb", "5a17", SECRET],
      [LARGE_B, "5a17", "5ec7e7"],
      ["1a79eb", SALT, "5ec7e7"],
      ["1a79eb", "5a17", "5ec7e7"],
    ])(
      "should not produce the correct password signature if any cognito session parameters are wrong, with cognito values: %p %p %p",
      (largeB, salt, secret) => {
        const clientSession = srpAuthenticationHelper.createClientSession(
          USERNAME,
          PASSWORD,
          POOL_ID
        );
        const cognitoSessionWrong =
          srpAuthenticationHelper.createCognitoSession(largeB, salt, secret);
        const timestamp = srpAuthenticationHelper.createTimestamp();
        const passwordSignature =
          srpAuthenticationHelper.computePasswordSignature(
            clientSession,
            cognitoSessionWrong,
            timestamp
          );
        expect(passwordSignature).not.toEqual(PASSWORD_SIGNATURE);
      }
    );

    it.each([
      "",
      "Feb 1 03:04:05 UTC 2000",
      "Tue 1 03:04:05 UTC 2000",
      "Tue Feb 03:04:05 UTC 2000",
      "Tue Feb 1 03:04:05 2000",
      "Tue Feb 1 03:04:05 UTC",
      "Tue Feb 01 03:04:05 UTC 2000",
      "Tue Feb 1 3:04:05 UTC 2000",
      "Tue Feb 1 03:4:05 UTC 2000",
      "Tue Feb 1 03:04:5 UTC 2000",
      "Tue Feb 1 03:04:05 UTC 20",
      "Tue Feb 1 03:04:05 UTC 00",
      " Tue Feb 1 03:04:05 UTC 2000",
      "Tue Feb 1 03:04:05 UTC 2000 ",
      " Tue Feb 1 03:04:05 UTC 2000 ",
      "TueFeb 1 03:04:05 UTC 2000",
      "Tue Feb1 03:04:05 UTC 2000",
      "Tue Feb 103:04:05 UTC 2000",
      "Tue Feb 1 03:04:05UTC 2000",
      "Tue Feb 1 03:04:05 UTC2000",
      "TueFeb103:04:05UTC2000",
    ])(
      "should not produce the correct password signature if the timestamp format is wrong, with timestamp: %p",
      (timestamp) => {
        const clientSession = srpAuthenticationHelper.createClientSession(
          USERNAME,
          PASSWORD,
          POOL_ID
        );
        const cognitoSessionWrong =
          srpAuthenticationHelper.createCognitoSession(LARGE_B, SALT, SECRET);
        const passwordSignature =
          srpAuthenticationHelper.computePasswordSignature(
            clientSession,
            cognitoSessionWrong,
            timestamp
          );
        expect(passwordSignature).not.toEqual(PASSWORD_SIGNATURE);
      }
    );
  });
});
