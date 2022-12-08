/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/*
  CHANGES:
  The Amplify implementation uses callbacks. This implementation moves logic
  into synchronous functions. It wraps logic used to calculate password
  signature into its own function. The timestamp function has been re-worked
  using toLocaleString. All SRP related functions have been placed inside the
  CognitoSrpHelper class.
*/

import CryptoJS from "crypto-js";
import { BigInteger } from "jsbn";

import { INFO_BITS, G, N, K } from "./constants";
import { InitiateAuthResponse, ClientSession, CognitoSession } from "./types";
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
    const prk = CryptoJS.HmacSHA256(ikmWordArray, saltWordArray);
    const hmac = CryptoJS.HmacSHA256(infoBitsWordArray, prk);
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
   * @param username The user's username
   * @param password The user's password
   * @param poolId The ID of the AWS Cognito user pool the user belongs to
   */
  public createClientSession(
    username: string,
    password: string,
    poolId: string
  ): ClientSession {
    // Assert parameters exist
    if (username === undefined || username === "")
      throw new ReferenceError(
        `Client session could not be initialised because username is undefined or empty`
      );
    if (password === undefined || password === "")
      throw new ReferenceError(
        `Client session could not be initialised because password is undefined or empty`
      );
    if (poolId === undefined || poolId === "")
      throw new ReferenceError(
        `Client session could not be initialised because poolId is undefined or empty`
      );

    // Client credentials
    const poolIdAbbr = poolId.split("_")[1];
    const usernamePassword = `${poolIdAbbr}${username}:${password}`;
    const passwordHash = hash(usernamePassword);
    // Client session keys
    const smallA = this.generateSmallA();
    const largeA = this.calculateLargeA(smallA);

    return {
      username,
      poolIdAbbr,
      passwordHash,
      smallA: smallA.toString(16),
      largeA: largeA.toString(16),
    };
  }

  /**
   * Asserts and bundles the SRP authentication values retrieved from Cognito
   * into a single object that can be passed into `createCognitoSession`
   *
   * @param initiateAuthResponse The response from calling CognitoIdentityServiceProvider's initiateAuth method. Note: initiateAuth should be called using the USER_SRP_AUTH auth flow, or CUSTOM_AUTH auth flow if SRP is used
   */
  public createCognitoSession(
    initiateAuthResponse?: InitiateAuthResponse
  ): CognitoSession {
    // Assert initiateAuthResponse and ChallengeParameters exist
    if (!initiateAuthResponse)
      throw new ReferenceError(
        `Cognito session could not be initialised because initiateAuthResponse is missing or falsy`
      );
    if (!initiateAuthResponse.ChallengeName)
      throw new ReferenceError(
        `Cognito session could not be initialised because initiateAuthResponse.ChallengeName is missing or falsy`
      );
    if (initiateAuthResponse.ChallengeName !== "PASSWORD_VERIFIER")
      throw new ReferenceError(
        `Cognito session could not be initialised because initiateAuthResponse.ChallengeName is not PASSWORD_VERIFIER`
      );
    if (!initiateAuthResponse.ChallengeParameters)
      throw new ReferenceError(
        `Cognito session could not be initialised because initiateAuthResponse.ChallengeParameters is missing or falsy`
      );

    const { SRP_B, SALT, SECRET_BLOCK } =
      initiateAuthResponse.ChallengeParameters;

    // Assert relevant SRP values exist
    if (!SRP_B)
      throw new ReferenceError(
        `Cognito session could not be initialised because SRP_B is missing or falsy`
      );
    if (!SALT)
      throw new ReferenceError(
        `Cognito session could not be initialised because SALT is missing or falsy`
      );
    if (!SECRET_BLOCK)
      throw new ReferenceError(
        `Cognito session could not be initialised because SECRET_BLOCK is missing or falsy`
      );

    return {
      largeB: SRP_B,
      salt: SALT,
      secret: SECRET_BLOCK,
    };
  }

  /**
   * Generate timestamp in the format required by Cognito:
   * `ddd MMM D HH:mm:ss UTC YYYY`. This timestamp is required when creating the
   * password signature via `computePasswordSignature`, and when responding to
   * the PASSWORD_VERIFIER challenge with `respondToAuthChallenge`. Both the
   * password signature and the `respondToAuthChallenge` need to share the same
   * timestamp
   */
  public createTimestamp(): string {
    const now = new Date();

    const locale = "en-US";
    const timeZone = "UTC";

    const weekDay = now.toLocaleString(locale, { timeZone, weekday: "short" });
    const day = now.toLocaleString(locale, { day: "numeric", timeZone });
    const month = now.toLocaleString(locale, { month: "short", timeZone });
    const year = now.getUTCFullYear();
    const time = now.toLocaleString(locale, {
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      second: "2-digit",
      timeZone,
    });

    // ddd MMM D HH:mm:ss UTC YYYY
    // EEE MMM d HH:mm:ss z yyyy in English
    return `${weekDay} ${month} ${day} ${time} UTC ${year}`;
  }

  /**
   * Computes the password signature to determine whether the password provided
   * by the user is correct or not. This signature is passed to
   * `PASSWORD_CLAIM_SIGNATURE` in a `respondToAuthChallenge` call
   *
   * @param clientSession Client session object containing user credentials and
   * session keys
   * @param cognitoSession Cognito session object containing public session key,
   * salt, and secret
   * @param timestamp Timestamp that matches the format required by Cognito
   */
  public computePasswordSignature(
    clientSession: ClientSession,
    cognitoSession: CognitoSession,
    timestamp: string
  ): string {
    // Assert parameters exist
    if (!clientSession)
      throw new ReferenceError(
        `Cognito session could not be initialised because clientSession is missing or falsy`
      );
    if (!cognitoSession)
      throw new ReferenceError(
        `Cognito session could not be initialised because cognitoSession is missing or falsy`
      );
    if (!timestamp)
      throw new ReferenceError(
        `Cognito session could not be initialised because timestamp is missing or falsy`
      );

    const { username, poolIdAbbr, passwordHash, smallA, largeA } =
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
        Buffer.from(poolIdAbbr, "utf8"),
        Buffer.from(username, "utf8"),
        Buffer.from(secret, "base64"),
        Buffer.from(timestamp, "utf8"),
      ])
    );
    const signatureString = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(message, key)
    );

    return signatureString;
  }
}

export default CognitoSrpHelper;
