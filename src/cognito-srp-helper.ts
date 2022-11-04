import CryptoJS, { HmacSHA256 } from "crypto-js";
import { BigInteger } from "jsbn";

import { INFO_BITS, G, N, K } from "./constants";
import { ClientSession, CognitoSession } from "./types";
import { hash, hexHash, padHex, randomBytes } from "./utils";

/**
 * Helper class used to perform calculations required for SRP authentication in
 * AWS Cognito. This is required any time you call initiateAuth with the
 * `USER_SRP_AUTH` authentication flow:
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html#Built-in-authentication-flow-and-challenges
 *
 * or `CUSTOM_AUTH` authentication flow if you also require password verification:
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html#Using-SRP-password-verification-in-custom-authentication-flow
 *
 * To perform SRP authentication using these two flows we need the `SRP_A`,
 * `TIMESTAMP`, and `PASSWORD_CLAIM_SIGNATURE` values for `initiateAuth` and
 * `respondToAuthChallenge`. All of these values can be aquired through this
 * class by using a username, password, and pool ID.
 */
export class CognitoSrpHelper {
  // AWS Cognito SRP calls require a specific timestamp format: ddd MMM D HH:mm:ss UTC YYYY
  private getCognitoTimeStamp(): string {
    const now = new Date();

    const locale = "en-US";
    const timeZone = "UTC";

    const weekDay = now.toLocaleString(locale, { timeZone, weekday: "short" });
    const day = now.toLocaleString(locale, { day: "2-digit", timeZone });
    const month = now.toLocaleString(locale, { month: "short", timeZone });
    const year = now.getUTCFullYear();
    const time = now.toLocaleString(locale, {
      hour: "numeric",
      hour12: false,
      minute: "numeric",
      second: "numeric",
      timeZone,
    });

    // ddd MMM D HH:mm:ss UTC YYYY
    return `${weekDay} ${month} ${day} ${time} UTC ${year}`;
  }

  private generateSmallA(): BigInteger {
    // This will be interpreted as a postive 128-bit integer
    const hexRandom = randomBytes(128).toString("hex");
    const randomBigInt = new BigInteger(hexRandom, 16);

    // There is no need to do randomBigInt.mod(N - 1) as N (3072-bit) is > 128 bytes (1024-bit)

    return randomBigInt;
  }

  private calculateLargeA(smallA: BigInteger): BigInteger {
    const largeA = G.modPow(smallA, N);
    return largeA;
  }

  private computeHkdf(ikm: Buffer | string, salt: Buffer | string): Buffer {
    // Create word arrays
    const infoBitsWordArray = CryptoJS.lib.WordArray.create(
      Buffer.concat([INFO_BITS, Buffer.from(String.fromCharCode(1), "utf8")])
    );
    const ikmWordArray =
      ikm instanceof Buffer ? CryptoJS.lib.WordArray.create(ikm) : ikm;
    const saltWordArray =
      salt instanceof Buffer ? CryptoJS.lib.WordArray.create(salt) : salt;

    // Create Hmacs
    const prk = HmacSHA256(ikmWordArray, saltWordArray);
    const hmac = HmacSHA256(infoBitsWordArray, prk);
    const hkdf = Buffer.from(hmac.toString(), "hex").slice(0, 16);

    return hkdf;
  }

  private calculateU(largeA: BigInteger, largeB: BigInteger): BigInteger {
    const uHexHash = hexHash(padHex(largeA) + padHex(largeB));
    const u = new BigInteger(uHexHash, 16);
    return u;
  }

  private calculateS(
    x: BigInteger,
    largeB: BigInteger,
    smallA: BigInteger,
    u: BigInteger
  ): BigInteger {
    const gModPowXN = G.modPow(x, N);
    const intValue2 = largeB.subtract(K.multiply(gModPowXN));
    const s = intValue2.modPow(smallA.add(u.multiply(x)), N);
    return s;
  }

  private calculateX(
    salt: BigInteger,
    usernamePasswordHash: string
  ): BigInteger {
    const x = new BigInteger(hexHash(padHex(salt) + usernamePasswordHash), 16);
    return x;
  }

  /**
   * Creates the required data needed to initiate SRP authentication with AWS
   * Cognito. The public session key `largeA` is passed to `SRP_A` in the
   * initiateAuth call. The rest of the values are used later to compute the
   * `PASSWORD_CLAIM_SIGNATURE` when responding to a `PASSWORD_VERIFICATION`
   * challenge with `respondToAuthChallenge`
   *
   * @param username The user's AWS Cognito username
   * @param password The user's AWS Cognito password
   * @param poolId The ID of the AWS Cognito user pool the user belongs to
   */
  public createClientSession(
    username?: string,
    password?: string,
    poolId?: string
  ): ClientSession {
    // Assert parameters exist
    if (!username)
      throw new ReferenceError(
        `Client session could not be initialised because username is missing or falsy`
      );
    if (!password)
      throw new ReferenceError(
        `Client session could not be initialised because password is missing or falsy`
      );
    if (!poolId)
      throw new ReferenceError(
        `Client session could not be initialised because poolId is missing or falsy`
      );

    // Client credentials
    const poolIdNumber = poolId.split("_")[1];
    const usernamePassword = `${poolIdNumber}${username}:${password}`;
    const passwordHash = hash(usernamePassword);
    // Client session keys
    const smallA = this.generateSmallA();
    const largeA = this.calculateLargeA(smallA);
    // Cognito unique timestamp
    const timestamp = this.getCognitoTimeStamp();

    return {
      largeA: largeA.toString(16),
      passwordHash,
      poolId: poolIdNumber,
      smallA: smallA.toString(16),
      timestamp,
      username,
    };
  }

  /**
   * Asserts and bundles the SRP authentication values retrieved from Cognito
   * into a single object that can be passed into `createCognitoSession`
   *
   * @param largeB The Cognito public session key
   * @param salt Value paired with user's password to ensure it's unqiue
   * @param secret A secret value used to authenticate our verification request
   */
  public createCognitoSession(
    largeB?: string,
    salt?: string,
    secret?: string
  ): CognitoSession {
    // Assert parameters exist
    if (!largeB)
      throw new ReferenceError(
        `Server session could not be initialised because largeB is missing or falsy`
      );
    if (!salt)
      throw new ReferenceError(
        `Server session could not be initialised because salt is missing or falsy`
      );
    if (!secret)
      throw new ReferenceError(
        `Server session could not be initialised because secret is missing or falsy`
      );

    return {
      largeB,
      salt,
      secret,
    };
  }

  /**
   * Computes the password signature to determine whether the password provided
   * by the user is correct or not. This signature is passed to
   * `PASSWORD_CLAIM_SIGNATURE` in a `respondToAuthChallenge` call
   *
   * @param clientSession Client session object containing user credentials,
   * session keys, and timestamp
   * @param cognitoSession Server session object containing public session key,
   * salt, and secret
   */
  public computePasswordSignature(
    clientSession: ClientSession,
    cognitoSession: CognitoSession
  ): string {
    // Assert parameters exist
    if (!clientSession)
      throw new ReferenceError(
        `Server session could not be initialised because clientSession is missing or falsy`
      );
    if (!cognitoSession)
      throw new ReferenceError(
        `Server session could not be initialised because cognitoSession is missing or falsy`
      );

    const { username, poolId, passwordHash, smallA, largeA, timestamp } =
      clientSession;
    const { largeB, salt, secret } = cognitoSession;

    const u = this.calculateU(
      new BigInteger(largeA, 16),
      new BigInteger(largeB, 16)
    );
    const x = this.calculateX(new BigInteger(salt, 16), passwordHash);
    const s = this.calculateS(
      x,
      new BigInteger(largeB, 16),
      new BigInteger(smallA, 16),
      u
    );
    const hkdf = this.computeHkdf(
      Buffer.from(padHex(s), "hex"),
      Buffer.from(padHex(u), "hex")
    );

    const key = CryptoJS.lib.WordArray.create(hkdf);
    const message = CryptoJS.lib.WordArray.create(
      Buffer.concat([
        Buffer.from(poolId, "utf8"),
        Buffer.from(username, "utf8"),
        Buffer.from(secret, "base64"),
        Buffer.from(timestamp, "utf8"),
      ])
    );
    const signatureString = CryptoJS.enc.Base64.stringify(
      HmacSHA256(message, key)
    );

    return signatureString;
  }
}

export default CognitoSrpHelper;
