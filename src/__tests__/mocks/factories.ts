import {
  Credentials,
  DeviceVerifier,
  InitiateAuthRequest,
  InitiateAuthResponse,
  RespondToAuthChallengeRequest,
  RespondToAuthChallengeResponse,
  SrpSession,
  SrpSessionSigned,
} from "../../types";

import {
  mockAdminInitiateAuthRequest,
  mockAdminRespondToAuthChallengeRequest,
  mockAdminRespondToAuthChallengeResponse,
  mockCredentials,
  mockDeviceVerifier,
  mockInitiateAuthRequest,
  mockInitiateAuthResponse,
  mockInitiateAuthResponseWithNewDevice,
  mockRespondToAuthChallengeRequest,
  mockRespondToAuthChallengeResponse,
  mockSession,
  mockSessionSigned,
  mockSessionSignedWithDevice,
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

export const mockSrpSessionSignedWithDeviceFactory = (session?: Partial<SrpSessionSigned>): SrpSessionSigned =>
  structuredClone({
    ...mockSessionSignedWithDevice,
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

export const mockInitiateAuthResponseWithNewDeviceFactory = (
  response?: Partial<InitiateAuthResponse>,
): InitiateAuthResponse =>
  structuredClone({
    ...mockInitiateAuthResponseWithNewDevice,
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

// RespondToAuthChallengeResponse

export const mockRespondToAuthChallengeResponseFactory = (
  response?: Partial<RespondToAuthChallengeResponse>,
): RespondToAuthChallengeResponse =>
  structuredClone({
    ...mockRespondToAuthChallengeResponse,
    ...response,
  });

export const mockAdminRespondToAuthChallengeResponseFactory = (
  response?: Partial<RespondToAuthChallengeResponse>,
): RespondToAuthChallengeResponse =>
  structuredClone({
    ...mockAdminRespondToAuthChallengeResponse,
    ...response,
  });

// DeviceVerifier

export const mockDeviceVerifierFactory = (verifier?: Partial<DeviceVerifier>): DeviceVerifier =>
  structuredClone({
    ...mockDeviceVerifier,
    ...verifier,
  });
