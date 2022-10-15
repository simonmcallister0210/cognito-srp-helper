import CryptoJS, { HmacSHA256, SHA256 } from "crypto-js";
import { BigInteger } from "jsbn";

/**
 * Helper class for SRP authentication in AWS Cognito. When using the `initiateAuth` or
 * `respondToAuthChallenge` SDK functions for SRP you need to generate values for `SRP_A` and
 * `PASSWORD_CLAIM_SIGNATURE` AuthParam, and can generate these values using the `getEphemeralKey` and
 * `getPasswordSignature` respectively
 */
export class SRPAuthenticationHelper {
  private INFO_BITS = Buffer.from("Caldera Derived Key", "utf8");
  private HEX_MSB_REGEX = /^[89a-f]/i;
  private G = new BigInteger("2", 16);
  private N = new BigInteger(
    "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1" +
      "29024E088A67CC74020BBEA63B139B22514A08798E3404DD" +
      "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245" +
      "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED" +
      "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D" +
      "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F" +
      "83655D23DCA3AD961C62F356208552BB9ED529077096966D" +
      "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B" +
      "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9" +
      "DE2BCBF6955817183995497CEA956AE515D2261898FA0510" +
      "15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64" +
      "ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7" +
      "ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B" +
      "F12FFA06D98A0864D87602733EC86A64521F2B18177B200C" +
      "BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31" +
      "43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF",
    16
  );

  private smallA: BigInteger;
  private largeA: BigInteger;
  private username: string;
  private password: string;
  private poolId: string;
  private timestamp: string;

  constructor(username: string, password: string, poolId: string) {
    this.smallA = this.generateSmallA();
    this.largeA = this.calculateA(this.smallA);
    this.username = username;
    this.password = password;
    this.poolId = poolId.split("_")[1];
    this.timestamp = this.getNowString();
  }

  // AWS Cognito SRP calls require a specific timestamp format: ddd MMM D HH:mm:ss UTC YYYY
  private getNowString = (): string => {
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
  };

  private hash = (buf: Buffer | string): string => {
    const str =
      buf instanceof Buffer ? CryptoJS.lib.WordArray.create(buf) : buf;
    const hashHex = SHA256(str).toString();
    const completeHash = new Array(64 - hashHex.length).join("0") + hashHex;

    return completeHash;
  };

  private hexHash = (hexStr: string): string => {
    const hash = this.hash(Buffer.from(hexStr, "hex"));

    return hash;
  };

  private padHex = (bigInt: BigInteger): string => {
    if (!(bigInt instanceof BigInteger)) {
      throw new Error("Not a BigInteger");
    }

    const isNegative = bigInt.compareTo(BigInteger.ZERO) < 0;

    // Get a hex string for abs(bigInt)
    let hexStr = bigInt.abs().toString(16);

    // Pad hex to even length if needed
    hexStr = hexStr.length % 2 !== 0 ? `0${hexStr}` : hexStr;

    // Prepend "00" if the most significant bit is set
    hexStr = this.HEX_MSB_REGEX.test(hexStr) ? `00${hexStr}` : hexStr;

    if (isNegative) {
      // Flip the bits of the representation
      const invertedNibbles = hexStr
        .split("")
        .map((x) => {
          const invertedNibble = ~parseInt(x, 16) & 0xf;
          return "0123456789ABCDEF".charAt(invertedNibble);
        })
        .join("");

      // After flipping the bits, add one to get the 2's complement representation
      const flippedBitsBI = new BigInteger(invertedNibbles, 16).add(
        BigInteger.ONE
      );

      hexStr = flippedBitsBI.toString(16);

      /*
            For hex strings starting with 'FF8', 'FF' can be dropped, e.g. 0xFFFF80=0xFF80=0x80=-128

            Any sequence of '1' bits on the left can always be substituted with a single '1' bit
            without changing the represented value.

            This only happens in the case when the input is 80...00
            */
      if (hexStr.toUpperCase().startsWith("FF8")) {
        hexStr = hexStr.substring(2);
      }
    }

    return hexStr;
  };

  private randomBytes = (nBytes: number): Buffer => {
    const bytes = Buffer.from(
      CryptoJS.lib.WordArray.random(nBytes).toString(),
      "hex"
    );

    return bytes;
  };

  private generateSmallA = (): BigInteger => {
    // This will be interpreted as a postive 128-bit integer
    const hexRandom = this.randomBytes(128).toString("hex");
    const randomBigInt = new BigInteger(hexRandom, 16);

    // There is no need to do randomBigInt.mod(this.N - 1) as N (3072-bit) is > 128 bytes (1024-bit)

    return randomBigInt;
  };

  private calculateA = (smallA: BigInteger): BigInteger => {
    const largeA = this.G.modPow(smallA, this.N);
    return largeA;
  };

  private computeHkdf = (
    ikm: Buffer | string,
    salt: Buffer | string
  ): Buffer => {
    // Create word arrays
    const infoBitsWordArray = CryptoJS.lib.WordArray.create(
      Buffer.concat([
        this.INFO_BITS,
        Buffer.from(String.fromCharCode(1), "utf8"),
      ])
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
  };

  private calculateU = (largeA: BigInteger, largeB: BigInteger): BigInteger => {
    const uHexHash = this.hexHash(this.padHex(largeA) + this.padHex(largeB));
    const u = new BigInteger(uHexHash, 16);
    return u;
  };

  private calculateS = (
    x: BigInteger,
    largeB: BigInteger,
    smallA: BigInteger,
    u: BigInteger
  ): BigInteger => {
    const k = new BigInteger(
      this.hexHash(`${this.padHex(this.N)}${this.padHex(this.G)}`),
      16
    );
    const gModPowXN = this.G.modPow(x, this.N);
    const intValue2 = largeB.subtract(k.multiply(gModPowXN));
    const s = intValue2.modPow(smallA.add(u.multiply(x)), this.N);
    return s;
  };

  private calculateX = (
    salt: BigInteger,
    usernamePasswordHash: string
  ): BigInteger => {
    const x = new BigInteger(
      this.hexHash(this.padHex(salt) + usernamePasswordHash),
      16
    );
    return x;
  };

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
    const usernamePasswordHash = this.hash(usernamePassword);

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
      Buffer.from(this.padHex(s), "hex"),
      Buffer.from(this.padHex(u), "hex")
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
