import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { RespondToAuthChallengeRequest } from "../../types";
import { mockAdminRespondToAuthChallengeRequestFactory } from "../mocks/factories";

const { ChallengeResponses } = mockAdminRespondToAuthChallengeRequestFactory();

export const positiveAdminRespondToAuthChallengeRequests: Record<string, RespondToAuthChallengeRequest> = {
  default: mockAdminRespondToAuthChallengeRequestFactory(),
  // ChallengeName
  challengeNamePasswordVerifier: mockAdminRespondToAuthChallengeRequestFactory({
    ChallengeName: "PASSWORD_VERIFIER",
  }),
  challengeNameUnknown: mockAdminRespondToAuthChallengeRequestFactory({
    ChallengeName: "UNKNOWN",
  }),
  // ClientId
  clientIdRandom: mockAdminRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdShort: mockAdminRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(1, { casing: "mixed" }),
  }),
  clientIdLong: mockAdminRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(10000, { casing: "mixed" }),
  }),
  // ChallengeResponses
  challengeResponsesOmitted: mockAdminRespondToAuthChallengeRequestFactory({
    ChallengeResponses: undefined,
  }),
  // SECRET_HASH
  secretHashRandom: mockAdminRespondToAuthChallengeRequestFactory({
    ChallengeResponses: {
      ...ChallengeResponses,
      SECRET_HASH: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
    },
  }),
  secretHashOmitted: mockAdminRespondToAuthChallengeRequestFactory({
    ChallengeResponses: {
      ...omit(ChallengeResponses, "SECRET_HASH"),
    },
  }),
  // USERNAME
  // ... needs to match session.username
};
