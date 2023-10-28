import {
  Credentials,
  InitiateAuthRequest,
  InitiateAuthResponse,
  RespondToAuthChallengeRequest,
  SrpSession,
  SrpSessionSigned,
} from "../../types";

import {
  mockAdminInitiateAuthRequest,
  mockAdminRespondToAuthChallengeRequest,
  mockCredentials,
  mockInitiateAuthRequest,
  mockInitiateAuthResponse,
  mockRespondToAuthChallengeRequest,
  mockSession,
  mockSessionSigned,
} from "./data";

export const mockCredentialsFactory = (credentials?: Partial<Credentials>): Credentials =>
  structuredClone({
    ...mockCredentials,
    ...credentials,
  });

export const mockSrpSessionFactory = (session?: Partial<SrpSession>): SrpSession =>
  structuredClone({
    ...mockSession,
    ...session,
  });

export const mockSrpSessionSignedFactory = (session?: Partial<SrpSessionSigned>): SrpSessionSigned =>
  structuredClone({
    ...mockSessionSigned,
    ...session,
  });

// InitiateAuthRequest

export const mockInitiateAuthRequestFactory = (request?: Partial<InitiateAuthRequest>): InitiateAuthRequest =>
  structuredClone({
    ...mockInitiateAuthRequest,
    ...request,
  });

export const mockAdminInitiateAuthRequestFactory = (request?: Partial<InitiateAuthRequest>): InitiateAuthRequest =>
  structuredClone({
    ...mockAdminInitiateAuthRequest,
    ...request,
  });

// InitiateAuthResponse

export const mockInitiateAuthResponseFactory = (response?: Partial<InitiateAuthResponse>): InitiateAuthResponse =>
  structuredClone({
    ...mockInitiateAuthResponse,
    ...response,
  });

// RespondToAuthChallengeRequest

export const mockRespondToAuthChallengeRequestFactory = (
  request?: Partial<RespondToAuthChallengeRequest>,
): RespondToAuthChallengeRequest =>
  structuredClone({
    ...mockRespondToAuthChallengeRequest,
    ...request,
  });

export const mockAdminRespondToAuthChallengeRequestFactory = (
  request?: Partial<RespondToAuthChallengeRequest>,
): RespondToAuthChallengeRequest =>
  structuredClone({
    ...mockAdminRespondToAuthChallengeRequest,
    ...request,
  });
