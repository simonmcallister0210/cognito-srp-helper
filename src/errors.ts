// Wrap SRP request errors

export class WrapSrpRequestTypeError extends TypeError {
  constructor(
    message = "Could not wrap SRP request due to invalid parameter type"
  ) {
    super(message);
  }
}

export class SrpSessionSignedTypeError extends WrapSrpRequestTypeError {
  constructor(
    message = "Could not wrap SRP request due to invalid SrpSessionSigned. If you are wrapping a RespondToAuthChallengeRequest make sure the session you're using is signed (SrpSessionSigned)"
  ) {
    super(message);
  }
}

export class CognitoSrpRequestTypeError extends WrapSrpRequestTypeError {
  constructor(
    message = "Could not wrap SRP request due to invalid Cognito request. Make sure the request you are wrapping is a valid SRP request (InitiateAuthRequest or RespondToAuthChallengeRequest)"
  ) {
    super(message);
  }
}

// SRP calculation errors

export class AbortOnZeroSrpError extends Error {
  constructor(message = "Aborting SRP due to 0 value") {
    super(message);
  }
}

export class AbortOnZeroASrpError extends AbortOnZeroSrpError {
  constructor(
    message = "Aborting SRP due to 0 value received for client public key (A)"
  ) {
    super(message);
  }
}

export class AbortOnZeroBSrpError extends AbortOnZeroSrpError {
  constructor(
    message = "Aborting SRP due to 0 value received for server public key (B)"
  ) {
    super(message);
  }
}

export class AbortOnZeroUSrpError extends AbortOnZeroSrpError {
  constructor(
    message = "Aborting SRP due to 0 value received for public key hash (u)"
  ) {
    super(message);
  }
}
