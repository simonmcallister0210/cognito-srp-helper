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
  CognitoSrpHelper class
*/

import { Buffer } from "buffer/index.js"; // use the browser compatible buffer library
import CryptoJS from "crypto-js";
import { BigInteger } from "jsbn";

import { INFO_BITS, G, N, K } from "./constants.js";
import {
  AbortOnZeroSrpAError,
  AbortOnZeroSrpBError,
  AbortOnZeroSrpUError,
  ErrorMessages,
  IncorrectCognitoChallengeError,
} from "./exceptions.js";
import {
  InitiateAuthResponse,
  ClientSrpSession,
  CognitoSrpSession,
} from "./types.js";
import { hash, hexHash, padHex, randomBytes } from "./utils.js";

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

    if (largeA.equals(BigInteger.ZERO)) {
      throw new AbortOnZeroSrpAError();
    }

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

    if (u.equals(BigInteger.ZERO)) {
      throw new AbortOnZeroSrpUError();
    }

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
   * initiateAuth call. The rest of the values are used later in
   * `computePasswordSignature` to compute `PASSWORD_CLAIM_SIGNATURE`
   *
   * @param `username` The user's AWS Cognito username
   * @param `password` The user's AWS Cognito password
   * @param `poolId` The ID of the AWS Cognito user pool the user belongs to
   * @returns An object containing client SRP session details required to
   * complete our SRP authentication request
   * @throws `AbortOnZeroSrpAError` Abort SRP if value of 0 is generated for
   * client public key (A). This is _very_ unlikely to occur (~1/10^77) and is
   * simply a safeguard to protect against the session becoming advertently or
   * inadvertently insecure
   */
  public createClientSrpSession(
    username: string,
    password: string,
    poolId: string
  ): ClientSrpSession {
    // Check parameters exist
    if (username === undefined)
      throw new ReferenceError(ErrorMessages.UNDEF_USERNAME);
    if (password === undefined)
      throw new ReferenceError(ErrorMessages.UNDEF_PASSWORD);
    if (poolId === undefined)
      throw new ReferenceError(ErrorMessages.UNDEF_POOLID);

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
   * Validates and bundles the SRP authentication values retrieved from Cognito
   * into a single object that can be passed into `computePasswordSignature` to
   * compute `PASSWORD_CLAIM_SIGNATURE`
   *
   * @param initiateAuthResponse The response from calling
   * CognitoIdentityServiceProvider's initiateAuth method. Note: initiateAuth
   * should be called using the USER_SRP_AUTH auth flow, or CUSTOM_AUTH auth
   * flow if SRP is used
   * @returns An object containing Cognito SRP session details required to
   * complete our SRP authentication request
   * @throws `AbortOnZeroSrpBError` Abort SRP if value of 0 is generated for
   * Cognito public key (B). This is _very_ unlikely to occur (~1/10^77) and is
   * simply a safeguard to protect against the session becoming advertently or
   * inadvertently insecure
   * @throws `IncorrectCognitoChallengeError` If the challenge returned from
   * Cognito is not PASSWORD_VERIFIER, then this error is thrown. If your
   * Cognito app integration is configured correctly this shouldn't occur
   */
  public createCognitoSrpSession(
    initiateAuthResponse: InitiateAuthResponse
  ): CognitoSrpSession {
    // Check initiateAuthResponse and ChallengeParameters exist
    if (!initiateAuthResponse)
      throw new ReferenceError(ErrorMessages.UNDEF_INIT_AUTH);
    if (!initiateAuthResponse.ChallengeName)
      throw new ReferenceError(ErrorMessages.UNDEF_INIT_AUTH_CHALLENGE_NAME);
    if (initiateAuthResponse.ChallengeName !== "PASSWORD_VERIFIER")
      throw new IncorrectCognitoChallengeError(
        initiateAuthResponse.ChallengeName
      );
    if (!initiateAuthResponse.ChallengeParameters)
      throw new ReferenceError(ErrorMessages.UNDEF_INIT_AUTH_CHALLENGE_PARAMS);

    const {
      SRP_B: largeB,
      SALT: salt,
      SECRET_BLOCK: secret,
    } = initiateAuthResponse.ChallengeParameters;

    // Check relevant SRP values exist
    if (!largeB) throw new ReferenceError(ErrorMessages.UNDEF_SRP_B);
    if (!salt) throw new ReferenceError(ErrorMessages.UNDEF_SALT);
    if (!secret) throw new ReferenceError(ErrorMessages.UNDEF_SECRET_BLOCK);

    // Check server public key isn't 0
    if (largeB.replace(/^0+/, "") === "") throw new AbortOnZeroSrpBError();

    return {
      largeB,
      salt,
      secret,
    };
  }

  /**
   * Generate timestamp in the format required by Cognito:
   * `ddd MMM D HH:mm:ss UTC YYYY`. This timestamp is required when creating the
   * password signature via `computePasswordSignature`, and when responding to
   * the PASSWORD_VERIFIER challenge with `respondToAuthChallenge`. Both the
   * password signature and the `respondToAuthChallenge` need to share the same
   * timestamp
   *
   * @returns A timestamp in the format required by Cognito
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

    return `${weekDay} ${month} ${day} ${time} UTC ${year}`;
  }

  /**
   * Computes the password signature to determine whether the password provided
   * by the user is correct or not. This signature is passed to
   * `PASSWORD_CLAIM_SIGNATURE` in a `respondToAuthChallenge` call
   *
   * @param clientSrpSession Client SRP session object containing user
   * credentials and session keys
   * @param cognitoSrpSession Cognito SRP session object containing public
   * session key, salt, and secret
   * @param timestamp Timestamp that matches the format required by Cognito
   * @returns The password signature to pass to PASSWORD_CLAIM_SIGNATURE
   * @throws `AbortOnZeroSrpUError` Abort SRP if value of 0 is generated for the
   * public key hash (u). This is _very_ unlikely to occur (~1/10^77) and is
   * simply a safeguard to protect against the session becoming advertently or
   * inadvertently insecure
   */
  public computePasswordSignature(
    clientSrpSession: ClientSrpSession,
    cognitoSrpSession: CognitoSrpSession,
    timestamp: string
  ): string {
    // Check parameters exist
    if (!clientSrpSession)
      throw new ReferenceError(ErrorMessages.UNDEF_CLIENT_SRP_SESSION);
    if (!cognitoSrpSession)
      throw new ReferenceError(ErrorMessages.UNDEF_COGNITO_SRP_SESSION);
    if (!timestamp) throw new ReferenceError(ErrorMessages.UNDEF_TIMESTAMP);

    const { username, poolIdAbbr, passwordHash, smallA, largeA } =
      clientSrpSession;
    const { largeB, salt, secret } = cognitoSrpSession;

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
