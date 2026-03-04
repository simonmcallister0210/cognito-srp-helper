import {
  mockAdminRespondToAuthChallengeRequestFactory,
  mockRespondToAuthChallengeRequestFactory,
  mockSrpSessionSignedFactory,
} from "@/__tests__/mocks/factories";
import {
  positiveAdminRespondToAuthChallengeRequests as adminPositiveRequests,
  positiveRespondToAuthChallengeRequests as positiveRequests,
  positiveSrpSessionsSigned as positiveSessions,
} from "@/__tests__/test-cases";
import { wrapAuthChallenge } from "@/cognito-srp-helper";
import { RespondToAuthChallengeRequest } from "@/types";

describe("wrapAuthChallenge", () => {
  describe("positive", () => {
    it.each(Object.values(positiveSessions))(
      "should create the correct RespondToAuthChallengeRequest: session %#",
      async (session) => {
        const request = mockRespondToAuthChallengeRequestFactory();
        const srpRequest = await wrapAuthChallenge(session, request);
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
      async (request) => {
        const session = mockSrpSessionSignedFactory();
        const srpRequest = await wrapAuthChallenge(session, request);
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

    it.each(Object.values(positiveSessions))(
      "should create the correct AdminRespondToAuthChallengeRequest: session %#",
      async (session) => {
        const request = mockAdminRespondToAuthChallengeRequestFactory();
        const srpRequest = await wrapAuthChallenge(session, request);
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

    it.each(Object.values(adminPositiveRequests))(
      "should create the correct AdminRespondToAuthChallengeRequest: request %#",
      async (request) => {
        const session = mockSrpSessionSignedFactory();
        const srpRequest = await wrapAuthChallenge(session, request);
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
