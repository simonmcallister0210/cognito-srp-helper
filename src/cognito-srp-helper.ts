import {
  DeviceSecretVerifierConfigType,
  RespondToAuthChallengeResponse,
} from "@aws-sdk/client-cognito-identity-provider";
import { Buffer } from "buffer/"; // use the browser compatible buffer library
import CryptoJS from "crypto-js";
import { BigInteger } from "jsbn";

import { G, INFO_BITS, K, N } from "./constants";
import {
  AbortOnZeroASrpError,
  AbortOnZeroBSrpError,
  AbortOnZeroUSrpError,
  MissingChallengeResponsesError,
  MissingDeviceKeyError,
  MissingLargeBError,
  MissingSaltError,
  MissingSecretError,
} from "./errors";
import {
  InitiateAuthRequest,
  InitiateAuthResponse,
  RespondToAuthChallengeRequest,
  SrpSession,
  SrpSessionSigned,
} from "./types";
import { getBytesFromHex, hash, hexHash, padHex, randomBytes } from "./utils";

const generateSmallA = (): BigInteger => {
  // This will be interpreted as a postive 128-bit integer
  const hexRandom = randomBytes(128).toString("hex");
  const randomBigInt = new BigInteger(hexRandom, 16);

  // There is no need to do randomBigInt.mod(N - 1) as N (3072-bit) is > 128 bytes (1024-bit)

  return randomBigInt;
};

const calculateLargeA = (smallA: BigInteger): BigInteger => {
  const largeA = G.modPow(smallA, N);

  if (largeA.equals(BigInteger.ZERO)) {
    throw new AbortOnZeroASrpError();
  }

  return largeA;
};

const computeHkdf = (ikm: Buffer | string, salt: Buffer | string): Buffer => {
  // Create word arrays
  const infoBitsWordArray = CryptoJS.lib.WordArray.create(
    Buffer.concat([INFO_BITS, Buffer.from(String.fromCharCode(1), "utf8")]),
  );
  const ikmWordArray = ikm instanceof Buffer ? CryptoJS.lib.WordArray.create(ikm) : ikm;
  const saltWordArray = salt instanceof Buffer ? CryptoJS.lib.WordArray.create(salt) : salt;

  // Create Hmacs
  const prk = CryptoJS.HmacSHA256(ikmWordArray, saltWordArray);
  const hmac = CryptoJS.HmacSHA256(infoBitsWordArray, prk);
  const hkdf = Buffer.from(hmac.toString(), "hex").slice(0, 16);

  return hkdf;
};

const calculateU = (largeA: BigInteger, largeB: BigInteger): BigInteger => {
  const uHexHash = hexHash(padHex(largeA) + padHex(largeB));
  const u = new BigInteger(uHexHash, 16);

  if (u.equals(BigInteger.ZERO)) {
    throw new AbortOnZeroUSrpError();
  }

  return u;
};

const calculateS = (x: BigInteger, largeB: BigInteger, smallA: BigInteger, u: BigInteger): BigInteger => {
  const gModPowXN = G.modPow(x, N);
  const intValue2 = largeB.subtract(K.multiply(gModPowXN));
  const s = intValue2.modPow(smallA.add(u.multiply(x)), N);
  return s;
};

const calculateX = (salt: BigInteger, usernamePasswordHash: string): BigInteger => {
  const x = new BigInteger(hexHash(padHex(salt) + usernamePasswordHash), 16);
  return x;
};

const createTimestamp = (): string => {
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
};

export const createSecretHash = (userId: string, clientId: string, secretId: string): string => {
  const hmac = CryptoJS.HmacSHA256(`${userId}${clientId}`, secretId);
  const secretHash = hmac.toString(CryptoJS.enc.Base64);

  return secretHash;
};

export const createPasswordHash = (userId: string, password: string, poolId: string): string => {
  const poolIdAbbr = poolId.split("_")[1];
  const usernamePassword = `${poolIdAbbr}${userId}:${password}`;
  const passwordHash = hash(usernamePassword);

  return passwordHash;
};

export const createDeviceHash = (userId: string, password: string, deviceGroupKey: string): string => {
  const usernamePassword = `${deviceGroupKey}${userId}:${password}`;
  const passwordHash = hash(usernamePassword);

  return passwordHash;
};

export const createDeviceVerifier = (
  userId: string,
  deviceGroupKey: string,
): DeviceSecretVerifierConfigType & { FullPassword: string; RandomPassword: string } => {
  // 40 random bytes (aka. RANDOM_PASSWORD)
  const passwordRandom = randomBytes(40).toString("base64");

  // Device string (aka. FULL_PASSWORD)
  const device = `${deviceGroupKey}${userId}:${passwordRandom}`;
  const deviceHash = hash(device);

  // Salt
  const salt = randomBytes(16).toString("hex");
  const saltHash = padHex(new BigInteger(salt, 16));
  const saltBytes = Array.from(getBytesFromHex(saltHash), (byte) => String.fromCodePoint(byte)).join("");

  // Password verifier
  const passwordSalted = hexHash(saltHash + deviceHash);
  const passwordVerifier = G.modPow(new BigInteger(passwordSalted, 16), N);
  const passwordVerifierPadded = padHex(passwordVerifier);
  const passwordVerifierBytes = Array.from(getBytesFromHex(passwordVerifierPadded), (byte) =>
    String.fromCodePoint(byte),
  ).join("");

  return {
    RandomPassword: passwordRandom,
    FullPassword: deviceHash,
    PasswordVerifier: new Buffer(saltBytes).toString("base64"),
    Salt: new Buffer(passwordVerifierBytes).toString("base64"),
  };
};

export const createSrpSession = (username: string, password: string, poolId: string, isHashed = true): SrpSession => {
  const poolIdAbbr = poolId.split("_")[1];
  const timestamp = createTimestamp();
  const smallA = generateSmallA();
  const largeA = calculateLargeA(smallA);

  return {
    username,
    poolId,
    poolIdAbbr,
    password,
    isHashed,
    timestamp,
    smallA: smallA.toString(16),
    largeA: largeA.toString(16),
  };
};

export const signSrpSession = (session: SrpSession, response: InitiateAuthResponse): SrpSessionSigned => {
  // Assert SRP ChallengeParameters
  if (!response.ChallengeParameters) throw new MissingChallengeResponsesError();
  if (!response.ChallengeParameters.SALT) throw new MissingSaltError();
  if (!response.ChallengeParameters.SECRET_BLOCK) throw new MissingSecretError();
  if (!response.ChallengeParameters.SRP_B) throw new MissingLargeBError();

  const {
    SALT: salt,
    SECRET_BLOCK: secret,
    SRP_B: largeB,
    USER_ID_FOR_SRP: userIdForSrp,
  } = response.ChallengeParameters;
  const { poolId, poolIdAbbr, password, isHashed, timestamp, smallA, largeA } = session;

  // Check server public key isn't 0
  if (largeB.replace(/^0+/, "") === "") throw new AbortOnZeroBSrpError();

  // Hash the password if it isn't already hashed
  const passwordHash = isHashed ? password : createPasswordHash(userIdForSrp, password, poolId);

  const u = calculateU(new BigInteger(largeA, 16), new BigInteger(largeB, 16));
  const x = calculateX(new BigInteger(salt, 16), passwordHash);
  const s = calculateS(x, new BigInteger(largeB, 16), new BigInteger(smallA, 16), u);
  const hkdf = computeHkdf(Buffer.from(padHex(s), "hex"), Buffer.from(padHex(u), "hex"));

  const key = CryptoJS.lib.WordArray.create(hkdf);
  const message = CryptoJS.lib.WordArray.create(
    Buffer.concat([
      Buffer.from(poolIdAbbr, "utf8"),
      Buffer.from(userIdForSrp, "utf8"),
      Buffer.from(secret, "base64"),
      Buffer.from(timestamp, "utf8"),
    ]),
  );
  const passwordSignature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, key));

  return {
    ...session,
    salt,
    secret,
    largeB,
    passwordSignature,
  };
};

export const signSrpSessionWithDevice = (
  session: SrpSession,
  response: InitiateAuthResponse,
  deviceGroupKey: string,
  deviceRandomPassword: string,
): SrpSessionSigned => {
  // Assert SRP ChallengeParameters
  if (!response.ChallengeParameters) throw new MissingChallengeResponsesError();
  if (!response.ChallengeParameters.DEVICE_KEY) throw new MissingDeviceKeyError();
  if (!response.ChallengeParameters.SALT) throw new MissingSaltError();
  if (!response.ChallengeParameters.SECRET_BLOCK) throw new MissingSecretError();
  if (!response.ChallengeParameters.SRP_B) throw new MissingLargeBError();

  const { DEVICE_KEY: deviceKey, SALT: salt, SECRET_BLOCK: secret, SRP_B: largeB } = response.ChallengeParameters;
  const { poolId, timestamp, smallA, largeA } = session;

  // Check server public key isn't 0
  if (largeB.replace(/^0+/, "") === "") throw new AbortOnZeroBSrpError();

  // Hash the password if it isn't already hashed
  const passwordHash = createPasswordHash(deviceGroupKey, deviceRandomPassword, poolId);

  const u = calculateU(new BigInteger(largeA, 16), new BigInteger(largeB, 16));
  const x = calculateX(new BigInteger(salt, 16), passwordHash);
  const s = calculateS(x, new BigInteger(largeB, 16), new BigInteger(smallA, 16), u);
  const hkdf = computeHkdf(Buffer.from(padHex(s), "hex"), Buffer.from(padHex(u), "hex"));

  const key = CryptoJS.lib.WordArray.create(hkdf);
  const message = CryptoJS.lib.WordArray.create(
    Buffer.concat([
      Buffer.from(deviceGroupKey, "utf8"),
      Buffer.from(deviceKey, "utf8"),
      Buffer.from(secret, "base64"),
      Buffer.from(timestamp, "utf8"),
    ]),
  );
  const passwordSignature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, key));

  return {
    ...session,
    salt,
    secret,
    largeB,
    passwordSignature,
  };
};

export const wrapInitiateAuth = <T extends InitiateAuthRequest>(session: SrpSession, request: T): T => ({
  ...request,
  AuthParameters: {
    ...request.AuthParameters, // ignored if request.AuthParameters doesn't exist
    SRP_A: session.largeA,
  },
});

export const wrapAuthChallenge = <T extends RespondToAuthChallengeRequest>(
  session: SrpSessionSigned,
  request: T,
): T => ({
  ...request,
  ChallengeResponses: {
    ...request.ChallengeResponses, // ignored if request.ChallengeResponses doesn't exist
    PASSWORD_CLAIM_SECRET_BLOCK: session.secret,
    PASSWORD_CLAIM_SIGNATURE: session.passwordSignature,
    SRP_A: session.largeA,
    TIMESTAMP: session.timestamp,
  },
});
