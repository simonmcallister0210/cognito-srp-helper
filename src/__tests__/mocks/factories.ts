import clonedeep from "lodash.clonedeep";
import {
  Credentials,
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
} from "./data.js";

export const mockCredentialsFactory = (
  credentials?: Partial<Credentials>
): Credentials =>
  clonedeep({
    ...mockCredentials,
    ...credentials,
  });

export const mockSrpSessionFactory = (
  session?: Partial<SrpSession>
): SrpSession =>
  clonedeep({
    ...mockSession,
    ...session,
  });

export const mockSrpSessionSignedFactory = (
  session?: Partial<SrpSessionSigned>
): SrpSessionSigned =>
  clonedeep({
    ...mockSessionSigned,
    ...session,
  });

export const mockInitiateAuthRequestFactory = (
  request?: Partial<InitiateAuthRequest>
): InitiateAuthRequest =>
  clonedeep({
    ...mockInitiateAuthRequest,
    ...request,
  });

export const mockInitiateAuthResponseFactory = (
  response?: Partial<InitiateAuthResponse>
): InitiateAuthResponse =>
  clonedeep({
    ...mockInitiateAuthResponse,
    ...response,
  });

export const mockRespondToAuthChallengeRequestFactory = (
  request?: Partial<RespondToAuthChallengeRequest>
): RespondToAuthChallengeRequest =>
  clonedeep({
    ...mockRespondToAuthChallengeRequest,
    ...request,
  });
