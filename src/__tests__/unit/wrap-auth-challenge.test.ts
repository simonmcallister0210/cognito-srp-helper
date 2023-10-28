import { wrapAuthChallenge } from "../../cognito-srp-helper";
import { RespondToAuthChallengeRequest } from "../../types";
import {
  mockAdminRespondToAuthChallengeRequestFactory,
  mockRespondToAuthChallengeRequestFactory,
  mockSrpSessionSignedFactory,
} from "../mocks/factories";
import {
  positiveAdminRespondToAuthChallengeRequests as adminPositiveRequests,
  positiveRespondToAuthChallengeRequests as positiveRequests,
  positiveSrpSessionsSigned as positiveSessions,
} from "../test-cases";

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

    it.each(Object.values(positiveSessions))(
      "should create the correct AdminRespondToAuthChallengeRequest: session %#",
      (session) => {
        const request = mockAdminRespondToAuthChallengeRequestFactory();
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

    it.each(Object.values(adminPositiveRequests))(
      "should create the correct AdminRespondToAuthChallengeRequest: request %#",
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
