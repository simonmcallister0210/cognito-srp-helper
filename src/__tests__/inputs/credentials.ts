import { faker } from "@faker-js/faker";
import RandExp from "randexp";

import { Credentials } from "../../types.js";
import { mockCredentialsFactory } from "../mocks/factories.js";

export const positiveCredentials: Record<string, Credentials> = {
  default: mockCredentialsFactory(),
  // username
  usernameTypical: mockCredentialsFactory({
    username: faker.internet.userName(),
  }),
  usernameEmail: mockCredentialsFactory({
    username: faker.internet.email(),
  }),
  usernameEmailSpecialChars: mockCredentialsFactory({
    username: faker.internet.email("john", "doe", "example.fakerjs.dev", {
      allowSpecialCharacters: true,
    }),
  }),
  usernameUuid: mockCredentialsFactory({
    username: faker.datatype.uuid(),
  }),
  usernameSymbols: mockCredentialsFactory({
    username: faker.datatype.string(),
  }),
  usernameEmpty: mockCredentialsFactory({
    username: "",
  }),
  // password
  passwordMemorable: mockCredentialsFactory({
    password: faker.internet.password(20, true),
  }),
  passwordUnmemorable: mockCredentialsFactory({
    password: faker.internet.password(20, false),
  }),
  passwordSymbols: mockCredentialsFactory({
    password: faker.datatype.string(),
  }),
  passwordEmpty: mockCredentialsFactory({
    password: "",
  }),
  // poolId
  poolIdRandom: mockCredentialsFactory({
    poolId: new RandExp(/^(us(-gov)?|ap|ca|cn|eu|sa)-(central|(north|south)?(east|west)?)_[a-zA-Z0-9]{9}$/).gen(),
  }),
  // clientId
  clientIdRandom: mockCredentialsFactory({
    clientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdEmpty: mockCredentialsFactory({
    clientId: "",
  }),
  // secretId
  secretIdRandom: mockCredentialsFactory({
    clientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  secretIdEmpty: mockCredentialsFactory({
    clientId: "",
  }),
  // passwordHash
  passwordHashRandom: mockCredentialsFactory({
    passwordHash: faker.random.alphaNumeric(64, { casing: "lower" }),
  }),
  passwordHashEmpty: mockCredentialsFactory({
    passwordHash: "",
  }),
};
