import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { InitiateAuthRequest } from "../../types";
import { mockAdminInitiateAuthRequestFactory } from "../mocks/factories";

const { AuthParameters } = mockAdminInitiateAuthRequestFactory();

export const positiveAdminInitiateAuthRequests: Record<string, InitiateAuthRequest> = {
  default: mockAdminInitiateAuthRequestFactory(),
  // AuthFlow
  authFlowUserSrpAuth: mockAdminInitiateAuthRequestFactory({
    AuthFlow: "USER_SRP_AUTH",
  }),
  authFlowCustomAuth: mockAdminInitiateAuthRequestFactory({
    AuthFlow: "CUSTOM_AUTH",
  }),
  authFlowUnknown: mockAdminInitiateAuthRequestFactory({
    AuthFlow: "UNKNOWN",
  }),
  // ClientId
  clientIdRandom: mockAdminInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdShort: mockAdminInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(1, { casing: "mixed" }),
  }),
  clientIdLong: mockAdminInitiateAuthRequestFactory({
    ClientId: faker.random.alphaNumeric(10000, { casing: "mixed" }),
  }),
  // AuthParameters
  authParametersOmitted: mockAdminInitiateAuthRequestFactory({
    AuthParameters: undefined,
  }),
  // CHALLENGE_NAME
  challengeNameSrpA: mockAdminInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      ChallengeName: "SRP_A",
    },
  }),
  challengeNameUnknown: mockAdminInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      ChallengeName: "UNKNOWN",
    },
  }),
  // SECRET_HASH
  secretHashRandom: mockAdminInitiateAuthRequestFactory({
    AuthParameters: {
      ...AuthParameters,
      SECRET_HASH: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
    },
  }),
  secretHashOmitted: mockAdminInitiateAuthRequestFactory({
    AuthParameters: {
      ...omit(AuthParameters, "SECRET_HASH"),
    },
  }),
  // USERNAME
  // ... needs to match session.username
};
