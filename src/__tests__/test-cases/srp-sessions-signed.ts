import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import { SrpSessionSigned } from "../../types";
import { mockSrpSessionSignedFactory } from "../mocks/factories";

export const positiveSrpSessionsSigned: Record<string, SrpSessionSigned> = {
  default: mockSrpSessionSignedFactory(),
  // username
  usernameTypical: mockSrpSessionSignedFactory({
    username: faker.internet.userName(),
  }),
  usernameEmail: mockSrpSessionSignedFactory({
    username: faker.internet.email(),
  }),
  usernameEmailSpecialChars: mockSrpSessionSignedFactory({
    username: faker.internet.email("john", "doe", "example.fakerjs.dev", {
      allowSpecialCharacters: true,
    }),
  }),
  usernamePhone: mockSrpSessionSignedFactory({
    username: faker.phone.number(),
  }),
  usernameUuid: mockSrpSessionSignedFactory({
    username: faker.datatype.uuid(),
  }),
  usernameSymbols: mockSrpSessionSignedFactory({
    username: faker.datatype.string(),
  }),
  usernameEmpty: mockSrpSessionSignedFactory({
    username: "",
  }),
  // password
  passwordPlain: mockSrpSessionSignedFactory({
    password: faker.internet.password(),
  }),
  passwordHashRandom: mockSrpSessionSignedFactory({
    password: faker.random.alphaNumeric(64, { casing: "lower" }),
  }),
  passwordHashEmpty: mockSrpSessionSignedFactory({
    password: "",
  }),
  // poolIdAbbr
  poolIdAbbrRandom: mockSrpSessionSignedFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  poolIdAbbrEmpty: mockSrpSessionSignedFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  // timestamp
  timestampRandom: mockSrpSessionSignedFactory({
    timestamp: `
      ${faker.date.weekday({ abbr: true })}
      ${faker.date.month({ abbr: true })}
      ${faker.datatype.number({ min: 1, max: 31 })}
      ${faker.datatype.number({ min: 0, max: 23 }).toString().padStart(2, "0")}:\
      ${faker.datatype.number({ min: 0, max: 59 }).toString().padStart(2, "0")}:\
      ${faker.datatype.number({ min: 0, max: 59 }).toString().padStart(2, "0")}
      UTC
      ${faker.datatype.number({ min: 0, max: 9999 })}
    `,
  }),
  timestampWideHour: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 2000",
  }),
  timestampZeroMidnight: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 00:04:05 UTC 2000",
  }),
  timestampTwentyFourMidnight: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 24:04:05 UTC 2000",
  }),
  timestampNarrowYear: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 0",
  }),
  timestampWideYear: mockSrpSessionSignedFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 9999999999",
  }),
  // smallA
  smallARandom: mockSrpSessionSignedFactory({
    smallA: faker.random.alphaNumeric(256, { casing: "lower" }),
  }),
  smallAShort: mockSrpSessionSignedFactory({
    smallA: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  smallALong: mockSrpSessionSignedFactory({
    smallA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // largeA
  largeARandom: mockSrpSessionSignedFactory({
    largeA: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  largeAShort: mockSrpSessionSignedFactory({
    // 1 / 62 chance to return "0" which will trigger a AbortOnZeroASrpError, so ban the char
    largeA: faker.random.alphaNumeric(1, { casing: "lower", bannedChars: "0" }),
  }),
  largeALong: mockSrpSessionSignedFactory({
    largeA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // largeB
  largeBRandom: mockSrpSessionSignedFactory({
    largeB: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  largeBShort: mockSrpSessionSignedFactory({
    // 1 / 62 chance to return "0" which will trigger a AbortOnZeroBSrpError, so ban the char
    largeB: faker.random.alphaNumeric(1, { casing: "lower", bannedChars: "0" }),
  }),
  largeBLarge: mockSrpSessionSignedFactory({
    largeB: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // salt
  saltRandom: mockSrpSessionSignedFactory({
    salt: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  saltShort: mockSrpSessionSignedFactory({
    salt: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  saltLong: mockSrpSessionSignedFactory({
    salt: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // secret
  secretRandom: mockSrpSessionSignedFactory({
    secret: new RandExp(/^[A-Za-z0-9+=/]{1724}$/).gen(),
  }),
  secretShort: mockSrpSessionSignedFactory({
    secret: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
  }),
  secretLong: mockSrpSessionSignedFactory({
    secret: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
  }),
  // passwordSignature
  passwordSignatureRandom: mockSrpSessionSignedFactory({
    passwordSignature: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
  }),
  passwordSignatureShort: mockSrpSessionSignedFactory({
    passwordSignature: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
  }),
  passwordSignatureLong: mockSrpSessionSignedFactory({
    passwordSignature: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
  }),
};
