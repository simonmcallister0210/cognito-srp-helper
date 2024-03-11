import { faker } from "@faker-js/faker";

import { SrpSession } from "../../types";
import { mockSrpSessionFactory } from "../mocks/factories";

export const positiveSrpSessions: Record<string, SrpSession> = {
  default: mockSrpSessionFactory(),
  // username
  usernameTypical: mockSrpSessionFactory({
    username: faker.internet.userName(),
  }),
  usernameEmail: mockSrpSessionFactory({
    username: faker.internet.email(),
  }),
  usernameEmailSpecialChars: mockSrpSessionFactory({
    username: faker.internet.email("john", "doe", "example.fakerjs.dev", {
      allowSpecialCharacters: true,
    }),
  }),
  usernamePhone: mockSrpSessionFactory({
    username: faker.phone.number(),
  }),
  usernameUuid: mockSrpSessionFactory({
    username: faker.datatype.uuid(),
  }),
  usernameSymbols: mockSrpSessionFactory({
    username: faker.datatype.string(),
  }),
  usernameEmpty: mockSrpSessionFactory({
    username: "",
  }),
  // password
  passwordPlain: mockSrpSessionFactory({
    password: faker.internet.password(),
  }),
  passwordHashRandom: mockSrpSessionFactory({
    password: faker.random.alphaNumeric(64, { casing: "lower" }),
  }),
  passwordHashEmpty: mockSrpSessionFactory({
    password: "",
  }),
  // poolIdAbbr
  poolIdAbbrRandom: mockSrpSessionFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  poolIdAbbrEmpty: mockSrpSessionFactory({
    poolIdAbbr: faker.random.alphaNumeric(9, { casing: "mixed" }),
  }),
  // timestamp
  timestampRandom: mockSrpSessionFactory({
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
  timestampWideHour: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 2000",
  }),
  timestampZeroMidnight: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 00:04:05 UTC 2000",
  }),
  timestampTwentyFourMidnight: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 24:04:05 UTC 2000",
  }),
  timestampNarrowYear: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 0",
  }),
  timestampWideYear: mockSrpSessionFactory({
    timestamp: "Tue Feb 1 03:04:05 UTC 9999999999",
  }),
  // smallA
  smallARandom: mockSrpSessionFactory({
    smallA: faker.random.alphaNumeric(256, { casing: "lower" }),
  }),
  smallAShort: mockSrpSessionFactory({
    smallA: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  smallALong: mockSrpSessionFactory({
    smallA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
  // largeA
  largeARandom: mockSrpSessionFactory({
    largeA: faker.random.alphaNumeric(1024, { casing: "lower" }),
  }),
  largeAShort: mockSrpSessionFactory({
    largeA: faker.random.alphaNumeric(1, { casing: "lower" }),
  }),
  largeALong: mockSrpSessionFactory({
    largeA: faker.random.alphaNumeric(10000, { casing: "lower" }),
  }),
};
