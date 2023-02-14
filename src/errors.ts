// sign SRP session errors

export class SignSrpSessionError extends Error {
  constructor(message = "Could not sign SRP session") {
    super(message);
  }
}

export class MissingChallengeResponsesError extends SignSrpSessionError {
  constructor(
    message = "Could not sign SRP session because of missing or undefined ChallengeResponses in response"
  ) {
    super(message);
  }
}

export class MissingSaltError extends SignSrpSessionError {
  constructor(
    message = "Could not sign SRP session because of missing or undefined SALT in response.ChallengeResponses"
  ) {
    super(message);
  }
}

export class MissingSecretError extends SignSrpSessionError {
  constructor(
    message = "Could not sign SRP session because of missing or undefined SECRET_BLOCK in response.ChallengeResponses"
  ) {
    super(message);
  }
}

export class MissingLargeBError extends SignSrpSessionError {
  constructor(
    message = "Could not sign SRP session because of missing or undefined SRP_B in response.ChallengeResponses"
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
