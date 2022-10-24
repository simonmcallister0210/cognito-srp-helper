import CryptoJS, { HmacSHA256 } from "crypto-js";
import { BigInteger } from "jsbn";
import { INFO_BITS, G, N, K } from "./constants";
import { hash, hexHash, padHex, randomBytes } from "./utils";

/**
 * Helper class for SRP authentication in AWS Cognito. When using the `initiateAuth` or
 * `respondToAuthChallenge` SDK functions for SRP you need to generate values for `SRP_A` and
 * `PASSWORD_CLAIM_SIGNATURE` AuthParam, and can generate these values using the `getEphemeralKey` and
 * `getPasswordSignature` respectively
 */
export class SRPAuthenticationHelper {
  private smallA: BigInteger;
  private largeA: BigInteger;
  private username: string;
  private password: string;
  private poolId: string;
  private timestamp: string;

  constructor(username: string, password: string, poolId: string) {
    this.smallA = this.generateSmallA();
    this.largeA = this.calculateLargeA(this.smallA);
    this.username = username;
    this.password = password;
    this.poolId = poolId.split("_")[1];
    this.timestamp = this.getNowString();
    console.log("this.smallA"); // TODO: DEBUG
    console.log(this.smallA.toString(16)); // TODO: DEBUG
  }

  // AWS Cognito SRP calls require a specific timestamp format: ddd MMM D HH:mm:ss UTC YYYY
  private getNowString(): string {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const weekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const weekDay = weekNames[now.getUTCDay()];
    const month = monthNames[now.getUTCMonth()];
    const day = now.getUTCDate();
    const hours =
      now.getUTCHours() < 10 ? `0${now.getUTCHours()}` : `${now.getUTCHours()}`;
    const minutes =
      now.getUTCMinutes() < 10
        ? `0${now.getUTCMinutes()}`
        : `${now.getUTCMinutes()}`;
    const seconds =
      now.getUTCSeconds() < 10
        ? `0${now.getUTCSeconds()}`
        : `${now.getUTCSeconds()}`;
    const year = now.getUTCFullYear();
    // ddd MMM D HH:mm:ss UTC YYYY
    const dateNow = `${weekDay} ${month} ${day} ${hours}:${minutes}:${seconds} UTC ${year}`;
    return dateNow;
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

  /** Get SRP_A value */
  public getEphemeralKey = (): string => this.largeA.toString(16);

  /** Get TIMESTAMP value */
  public getTimeStamp = (): string => this.timestamp;

  /** Get PASSWORD_CLAIM_SIGNATURE value */
  public getPasswordSignature = (
    serverEphemeralKey: string,
    serverSecretBlock: string,
    serverSalt: string
  ): string => {
    const usernamePassword = `${this.poolId}${this.username}:${this.password}`;
    const usernamePasswordHash = hash(usernamePassword);

    const u = this.calculateU(
      this.largeA,
      new BigInteger(serverEphemeralKey, 16)
    );
    const x = this.calculateX(
      new BigInteger(serverSalt, 16),
      usernamePasswordHash
    );
    const s = this.calculateS(
      x,
      new BigInteger(serverEphemeralKey, 16),
      this.smallA,
      u
    );
    const hkdf = this.computeHkdf(
      Buffer.from(padHex(s), "hex"),
      Buffer.from(padHex(u), "hex")
    );

    const key = CryptoJS.lib.WordArray.create(hkdf);
    const message = CryptoJS.lib.WordArray.create(
      Buffer.concat([
        Buffer.from(this.poolId, "utf8"),
        Buffer.from(this.username, "utf8"),
        Buffer.from(serverSecretBlock, "base64"),
        Buffer.from(this.timestamp, "utf8"),
      ])
    );
    const signatureString = CryptoJS.enc.Base64.stringify(
      HmacSHA256(message, key)
    );

    return signatureString;
  };
}
