import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { RespondToAuthChallengeRequest } from "../../types.js";
import { mockRespondToAuthChallengeRequestFactory } from "../mocks/factories.js";

const { ChallengeResponses } = mockRespondToAuthChallengeRequestFactory();

export const positiveRespondToAuthChallengeRequests: Record<string, RespondToAuthChallengeRequest> = {
  default: mockRespondToAuthChallengeRequestFactory(),
  // ChallengeName
  challengeNamePasswordVerifier: mockRespondToAuthChallengeRequestFactory({
    ChallengeName: "PASSWORD_VERIFIER",
  }),
  challengeNameUnknown: mockRespondToAuthChallengeRequestFactory({
    ChallengeName: "UNKNOWN",
  }),
  // ClientId
  clientIdRandom: mockRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(26, { casing: "mixed" }),
  }),
  clientIdShort: mockRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(1, { casing: "mixed" }),
  }),
  clientIdLong: mockRespondToAuthChallengeRequestFactory({
    ClientId: faker.random.alphaNumeric(10000, { casing: "mixed" }),
  }),
  // ChallengeResponses
  challengeResponsesOmitted: mockRespondToAuthChallengeRequestFactory({
    ChallengeResponses: undefined,
  }),
  // SECRET_HASH
  secretHashRandom: mockRespondToAuthChallengeRequestFactory({
    ChallengeResponses: {
      ...ChallengeResponses,
      SECRET_HASH: new RandExp(/^[A-Za-z0-9+=/]{44}$/).gen(),
    },
  }),
  secretHashOmitted: mockRespondToAuthChallengeRequestFactory({
    ChallengeResponses: {
      ...omit(ChallengeResponses, "SECRET_HASH"),
    },
  }),
  // USERNAME
  // ... needs to match session.username
};
