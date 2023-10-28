import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { InitiateAuthRequest } from "../../types";
import { mockInitiateAuthRequestFactory } from "../mocks/factories";

const { AuthParameters } = mockInitiateAuthRequestFactory();

export const positiveInitiateAuthRequests: Record<string, InitiateAuthRequest> = {
  default: mockInitiateAuthRequestFactory(),
  // AuthFlow
  authFlowUserSrpAuth: mockInitiateAuthRequestFactory({
    AuthFlow: "USER_SRP_AUTH",
  }),
  authFlowCustomAuth: mockInitiateAuthRequestFactory({
    AuthFlow: "CUSTOM_AUTH",
  }),
  authFlowUnknown: mockInitiateAuthRequestFactory({
    AuthFlow: "UNKNOWN",
  }),
  // ClientId
  clientIdRandom: mockInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdShort: mockInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(1, { casing: "mixed" }),
  }),
  clientIdLong: mockInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(10000, { casing: "mixed" }),
  }),
  // AuthParameters
  authParametersOmitted: mockInitiateAuthRequestFactory({
    AuthParameters: undefined,
  }),
  // CHALLENGE_NAME
  challengeNameSrpA: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      ChallengeName: "SRP_A",
    },
  }),
  challengeNameUnknown: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      ChallengeName: "UNKNOWN",
    },
  }),
  // SECRET_HASH
  secretHashRandom: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      SECRET_HASH: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
    },
  }),
  secretHashOmitted: mockInitiateAuthRequestFactory({
    AuthParameters: {
      ...omit(AuthParameters, "SECRET_HASH"),
    },
  }),
  // USERNAME
  // ... needs to match session.username
};
