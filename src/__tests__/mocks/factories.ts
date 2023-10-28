import clonedeep from "lodash.clonedeep";

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
  clonedeep({
    ...mockCredentials,
    ...credentials,
  });

export const mockSrpSessionFactory = (session?: Partial<SrpSession>): SrpSession =>
  clonedeep({
    ...mockSession,
    ...session,
  });

export const mockSrpSessionSignedFactory = (session?: Partial<SrpSessionSigned>): SrpSessionSigned =>
  clonedeep({
    ...mockSessionSigned,
    ...session,
  });

// InitiateAuthRequest

export const mockInitiateAuthRequestFactory = (request?: Partial<InitiateAuthRequest>): InitiateAuthRequest =>
  clonedeep({
    ...mockInitiateAuthRequest,
    ...request,
  });

export const mockAdminInitiateAuthRequestFactory = (request?: Partial<InitiateAuthRequest>): InitiateAuthRequest =>
  clonedeep({
    ...mockAdminInitiateAuthRequest,
    ...request,
  });

// InitiateAuthResponse

export const mockInitiateAuthResponseFactory = (response?: Partial<InitiateAuthResponse>): InitiateAuthResponse =>
  clonedeep({
    ...mockInitiateAuthResponse,
    ...response,
  });

// RespondToAuthChallengeRequest

export const mockRespondToAuthChallengeRequestFactory = (
  request?: Partial<RespondToAuthChallengeRequest>,
): RespondToAuthChallengeRequest =>
  clonedeep({
    ...mockRespondToAuthChallengeRequest,
    ...request,
  });

export const mockAdminRespondToAuthChallengeRequestFactory = (
  request?: Partial<RespondToAuthChallengeRequest>,
): RespondToAuthChallengeRequest =>
  clonedeep({
    ...mockAdminRespondToAuthChallengeRequest,
    ...request,
  });
