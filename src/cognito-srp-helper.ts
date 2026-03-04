import { G, INFO_BITS, N, ZERO } from "./constants";
import {
  AbortOnZeroASrpError,
  AbortOnZeroBSrpError,
  AbortOnZeroUSrpError,
  MissingChallengeResponsesError,
  MissingDeviceKeyError,
  MissingLargeBError,
  MissingSaltError,
  MissingSecretError,
  MissingUserIdForSrpBError,
} from "./errors";
import {
  DeviceVerifier,
  InitiateAuthRequest,
  InitiateAuthResponse,
  RespondToAuthChallengeRequest,
  RespondToAuthChallengeResponse,
  SrpSession,
  SrpSessionSigned,
} from "./types";
import {
  base64FromUint8Array,
  bigIntFromHex,
  computeHkdf,
  computeHmacSha256,
  generateRandomBase64,
  generateRandomBigInt,
  hashHex,
  hashString,
  hexFromBigInt,
  modPowBigInt,
  uint8ArrayFromBase64,
  uint8ArrayFromHex,
  uint8ArrayFromString,
} from "./utils";

const generateSmallA = (): bigint => {
  return generateRandomBigInt(128);
};

export const calculateLargeK = async (): Promise<bigint> =>
  bigIntFromHex(await hashHex(`${hexFromBigInt(N, true)}${hexFromBigInt(G, true)}`));

const calculateLargeA = (smallA: bigint): bigint => {
  const largeA = modPowBigInt(G, smallA, N);

  if (largeA === ZERO) {
    throw new AbortOnZeroASrpError();
  }

  return largeA;
};

const calculateU = async (largeA: bigint, largeB: bigint): Promise<bigint> => {
  const uHexHash = await hashHex(hexFromBigInt(largeA, true) + hexFromBigInt(largeB, true));
  const u = bigIntFromHex(uHexHash);

  if (u === ZERO) {
    throw new AbortOnZeroUSrpError();
  }

  return u;
};

const calculateS = async (x: bigint, largeB: bigint, smallA: bigint, u: bigint): Promise<bigint> => {
  const gModPowXN = modPowBigInt(G, x, N);
  const K = await calculateLargeK();
  const intValue2 = largeB - K * gModPowXN;
  const b = smallA + u * x;
  const s = modPowBigInt(intValue2, b, N);

  return s;
};

const calculateX = async (salt: bigint, usernamePasswordHash: string): Promise<bigint> => {
  return bigIntFromHex(await hashHex(hexFromBigInt(salt, true) + usernamePasswordHash));
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

const createSecretHashUint8Array = async (userId: string, clientId: string, secretId: string): Promise<Uint8Array> => {
  const messageArray = uint8ArrayFromString(`${userId}${clientId}`);
  const keyArray = uint8ArrayFromString(secretId);
  return await computeHmacSha256(messageArray, keyArray);
};

export const createSecretHash = async (userId: string, clientId: string, secretId: string): Promise<string> => {
  return base64FromUint8Array(await createSecretHashUint8Array(userId, clientId, secretId));
};

export const createPasswordHash = async (userId: string, password: string, poolId: string): Promise<string> => {
  const poolIdAbbr = poolId.split("_")[1];
  const usernamePassword = `${poolIdAbbr}${userId}:${password}`;
  const passwordHash = await hashString(usernamePassword);

  return passwordHash;
};

const createDeviceHash = async (deviceKey: string, password: string, deviceGroupKey: string): Promise<string> => {
  const devicePassword = `${deviceGroupKey}${deviceKey}:${password}`;
  const deviceHash = await hashString(devicePassword);

  return deviceHash;
};

export const createDeviceVerifier = async (deviceKey: string, deviceGroupKey: string): Promise<DeviceVerifier> => {
  // 40 random bytes encoded as base64 (aka. RANDOM_PASSWORD)
  const passwordRandom = generateRandomBase64(40);

  // Device string (aka. FULL_PASSWORD)
  const deviceHash = await createDeviceHash(deviceKey, passwordRandom, deviceGroupKey);

  // Salt
  const salt = generateRandomBigInt(16);
  const saltHash = hexFromBigInt(salt, true);
  const saltBase64 = base64FromUint8Array(uint8ArrayFromHex(saltHash));

  // Password verifier
  const passwordSalted = await hashHex(saltHash + deviceHash);
  const passwordVerifier = modPowBigInt(G, bigIntFromHex(passwordSalted), N);
  const passwordVerifierHex = hexFromBigInt(passwordVerifier, true);
  const passwordVerifierBase64 = base64FromUint8Array(uint8ArrayFromHex(passwordVerifierHex));

  return {
    DeviceRandomPassword: passwordRandom,
    DeviceSecretVerifierConfig: {
      PasswordVerifier: passwordVerifierBase64,
      Salt: saltBase64,
    },
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
    smallA: hexFromBigInt(smallA, false),
    largeA: hexFromBigInt(largeA, false),
  };
};

export const signSrpSession = async (
  session: SrpSession,
  response: InitiateAuthResponse,
): Promise<SrpSessionSigned> => {
  // Assert SRP ChallengeParameters
  if (!response.ChallengeParameters) throw new MissingChallengeResponsesError();
  if (!response.ChallengeParameters.SALT) throw new MissingSaltError();
  if (!response.ChallengeParameters.SECRET_BLOCK) {
    throw new MissingSecretError();
  }
  if (!response.ChallengeParameters.SRP_B) throw new MissingLargeBError();
  if (!response.ChallengeParameters.USER_ID_FOR_SRP) {
    throw new MissingUserIdForSrpBError();
  }

  const {
    SALT: saltHex,
    SECRET_BLOCK: secret,
    SRP_B: largeBHex,
    USER_ID_FOR_SRP: userIdForSrp,
  } = response.ChallengeParameters;
  const { poolId, poolIdAbbr, password, isHashed, timestamp, smallA: smallAHex, largeA: largeAHex } = session;
  const largeA = bigIntFromHex(largeAHex);
  const smallA = bigIntFromHex(smallAHex);
  const largeB = bigIntFromHex(largeBHex);
  const salt = bigIntFromHex(saltHex);

  // Check server public key isn't 0
  if (largeB === 0n) throw new AbortOnZeroBSrpError();

  // Hash the password if it isn't already hashed
  const passwordHash = isHashed ? password : await createPasswordHash(userIdForSrp, password, poolId);
  const [u, x] = await Promise.all([calculateU(largeA, largeB), calculateX(salt, passwordHash)]);
  const s = await calculateS(x, largeB, smallA, u);
  const hkdfKey = await computeHkdf({ ikm: s, salt: u, info: INFO_BITS });
  const message = new Uint8Array([
    ...uint8ArrayFromString(poolIdAbbr),
    ...uint8ArrayFromString(userIdForSrp),
    ...uint8ArrayFromBase64(secret),
    ...uint8ArrayFromString(timestamp),
  ]);
  const passwordSignature = base64FromUint8Array(await computeHmacSha256(message, hkdfKey));

  return {
    ...session,
    salt: saltHex,
    secret,
    largeB: largeBHex,
    passwordSignature,
  };
};

export const signSrpSessionWithDevice = async (
  session: SrpSession,
  response: RespondToAuthChallengeResponse,
  deviceGroupKey: string,
  deviceRandomPassword: string,
): Promise<SrpSessionSigned> => {
  // Assert SRP ChallengeParameters
  if (!response.ChallengeParameters) throw new MissingChallengeResponsesError();
  if (!response.ChallengeParameters.SALT) throw new MissingSaltError();
  if (!response.ChallengeParameters.SECRET_BLOCK) {
    throw new MissingSecretError();
  }
  if (!response.ChallengeParameters.SRP_B) throw new MissingLargeBError();
  if (!response.ChallengeParameters.DEVICE_KEY) {
    throw new MissingDeviceKeyError();
  }

  const { DEVICE_KEY: deviceKey, SALT: saltHex, SECRET_BLOCK: secret, SRP_B: largeBHex } = response.ChallengeParameters;
  const { timestamp, largeA: largeAHex, smallA: smallAHex } = session;
  const largeB = bigIntFromHex(largeBHex);
  const largeA = bigIntFromHex(largeAHex);
  const smallA = bigIntFromHex(smallAHex);
  const salt = bigIntFromHex(saltHex);

  // Check server public key isn't 0
  if (largeB === 0n) throw new AbortOnZeroBSrpError();

  const deviceHash = await createDeviceHash(deviceKey, deviceRandomPassword, deviceGroupKey);

  const [u, x] = await Promise.all([calculateU(largeA, largeB), calculateX(salt, deviceHash)]);
  const s = await calculateS(x, largeB, smallA, u);
  const hkdfKey = await computeHkdf({ ikm: s, salt: u, info: INFO_BITS });
  const message = new Uint8Array([
    ...uint8ArrayFromString(deviceGroupKey),
    ...uint8ArrayFromString(deviceKey),
    ...uint8ArrayFromBase64(secret),
    ...uint8ArrayFromString(timestamp),
  ]);
  const passwordSignature = base64FromUint8Array(await computeHmacSha256(message, hkdfKey));

  return {
    ...session,
    salt: saltHex,
    secret,
    largeB: largeBHex,
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
