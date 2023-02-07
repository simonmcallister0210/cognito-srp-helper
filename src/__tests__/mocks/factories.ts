import clonedeep from "lodash.clonedeep";
import {
  InitiateAuthResponse,
  InitiateAuthRequest,
  RespondToAuthChallengeRequest,
  SrpSession,
  SrpSessionSigned,
} from "../../types.js";
import {
  mockCredentials,
  mockSession,
  mockSessionSigned,
  mockInitiateAuthRequest,
  mockInitiateAuthResponse,
  mockRespondToAuthChallengeRequest,
} from "./values.js";

export const mockCredentialsFactory = (
  credentials?: Partial<typeof mockCredentials>
) =>
  clonedeep({
    ...mockCredentials,
    ...credentials,
  });

export const mockSrpSessionFactory = (session?: Partial<SrpSession>) =>
  clonedeep({
    ...mockSession,
    ...session,
  });

export const mockSrpSessionSignedFactory = (
  session?: Partial<SrpSessionSigned>
) =>
  clonedeep({
    ...mockSessionSigned,
    ...session,
  });

export const mockInitiateAuthRequestFactory = (
  request?: Partial<InitiateAuthRequest>
) =>
  clonedeep({
    ...mockInitiateAuthRequest,
    ...request,
  });

export const mockInitiateAuthResponseFactory = (
  response?: Partial<InitiateAuthResponse>
) =>
  clonedeep({
    ...mockInitiateAuthResponse,
    ...response,
  });

export const mockRespondToAuthChallengeRequestFactory = (
  request?: Partial<RespondToAuthChallengeRequest>
) =>
  clonedeep({
    ...mockRespondToAuthChallengeRequest,
    ...request,
  });
