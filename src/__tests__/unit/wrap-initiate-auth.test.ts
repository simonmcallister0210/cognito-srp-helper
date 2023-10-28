import { wrapInitiateAuth } from "../../cognito-srp-helper";
import { InitiateAuthRequest } from "../../types";
import { mockInitiateAuthRequestFactory, mockSrpSessionFactory } from "../mocks/factories";
import {
  positiveInitiateAuthRequests as positiveRequests,
  positiveSrpSessions as positiveSessions,
} from "../test-cases/index";

describe("wrapInitiateAuth", () => {
  describe("positive", () => {
    it.each(Object.values(positiveSessions))("should create the correct InitiateAuthRequest: session %#", (session) => {
      const request = mockInitiateAuthRequestFactory();
      const srpRequest = wrapInitiateAuth(session, request);
      expect(srpRequest).toMatchObject<InitiateAuthRequest>({
        ...request,
        AuthParameters: {
          ...request.AuthParameters,
          SRP_A: session.largeA,
        },
      });
    });

    it.each(Object.values(positiveRequests))("should create the correct InitiateAuthRequest: request %#", (request) => {
      const session = mockSrpSessionFactory();
      const srpRequest = wrapInitiateAuth(session, request);
      expect(srpRequest).toMatchObject<InitiateAuthRequest>({
        ...request,
        AuthParameters: {
          ...request.AuthParameters,
          SRP_A: session.largeA,
        },
      });
    });
  });
});
