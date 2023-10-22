import { wrapAuthChallenge } from "../../cognito-srp-helper.js";
import { RespondToAuthChallengeRequest } from "../../types.js";
import {
  positiveRespondToAuthChallengeRequests as positiveRequests,
  positiveSrpSessionsSigned as positiveSessions,
} from "../inputs/index.js";
import {
  mockRespondToAuthChallengeRequestFactory,
  mockSrpSessionSignedFactory,
} from "../mocks/factories.js";

describe("wrapAuthChallenge", () => {
  describe("positive", () => {
    it.each(Object.values(positiveSessions))(
      "should create the correct RespondToAuthChallengeRequest: session %#",
      (session) => {
        const request = mockRespondToAuthChallengeRequestFactory();
        const srpRequest = wrapAuthChallenge(session, request);
        expect(srpRequest).toMatchObject<RespondToAuthChallengeRequest>({
          ...request,
          ChallengeResponses: {
            ...request.ChallengeResponses,
            PASSWORD_CLAIM_SECRET_BLOCK: session.secret,
            PASSWORD_CLAIM_SIGNATURE: session.passwordSignature,
            TIMESTAMP: session.timestamp,
          },
        });
      },
    );

    it.each(Object.values(positiveRequests))(
      "should create the correct RespondToAuthChallengeRequest: request %#",
      (request) => {
        const session = mockSrpSessionSignedFactory();
        const srpRequest = wrapAuthChallenge(session, request);
        expect(srpRequest).toMatchObject<RespondToAuthChallengeRequest>({
          ...request,
          ChallengeResponses: {
            ...request.ChallengeResponses,
            PASSWORD_CLAIM_SECRET_BLOCK: session.secret,
            PASSWORD_CLAIM_SIGNATURE: session.passwordSignature,
            TIMESTAMP: session.timestamp,
          },
        });
      },
    );
  });
});
