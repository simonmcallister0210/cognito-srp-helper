export const ErrorMessages = {
  // createClientSrpSession reference error:
  UNDEF_USERNAME:
    "Client SRP session could not be initialised because username is undefined",
  UNDEF_PASSWORD:
    "Client SRP session could not be initialised because password is undefined",
  UNDEF_POOLID:
    "Client SRP session could not be initialised because poolId is undefined",
  // createCognitoSrpSession reference error:
  UNDEF_INIT_AUTH:
    "Cognito SRP session could not be initialised because initiateAuthResponse is undefined",
  UNDEF_INIT_AUTH_CHALLENGE_NAME:
    "Cognito SRP session could not be initialised because initiateAuthResponse.ChallengeName is undefined",
  UNDEF_INIT_AUTH_CHALLENGE_PARAMS:
    "Cognito SRP session could not be initialised because initiateAuthResponse.ChallengeParameters is undefined",
  UNDEF_SRP_B:
    "Cognito SRP session could not be initialised because SRP_B is undefined",
  UNDEF_SALT:
    "Cognito SRP session could not be initialised because SALT is undefined",
  UNDEF_SECRET_BLOCK:
    "Cognito SRP session could not be initialised because SECRET_BLOCK is undefined",
  // computePasswordSignature reference error:
  UNDEF_CLIENT_SRP_SESSION:
    "Cognito SRP session could not be initialised because clientSrpSession is undefined",
  UNDEF_COGNITO_SRP_SESSION:
    "Cognito SRP session could not be initialised because cognitoSrpSession is undefined",
  UNDEF_TIMESTAMP:
    "Cognito SRP session could not be initialised because timestamp is undefined",
  // Abort on zero error:
  ABORT_ON_ZERO_SRP: "Aborting SRP due to 0 value",
  ABORT_ON_ZERO_SRP_A:
    "Aborting SRP due to 0 value received for client public key (A)",
  ABORT_ON_ZERO_SRP_B:
    "Aborting SRP due to 0 value received for server public key (B)",
  ABORT_ON_ZERO_SRP_U:
    "Aborting SRP due to 0 value received for public key hash (u)",
  // Inccorect challenge error:
  INCORRECT_COGNITO_CHALLENGE:
    "Cognito SRP session could not be initialised because initiateAuthResponse.ChallengeName is not PASSWORD_VERIFIER. Received: ",
};

export class AbortOnZeroSrpError extends Error {
  constructor(message = ErrorMessages.ABORT_ON_ZERO_SRP) {
    super(message);
  }
}

export class AbortOnZeroSrpAError extends AbortOnZeroSrpError {
  constructor() {
    super(ErrorMessages.ABORT_ON_ZERO_SRP_A);
  }
}

export class AbortOnZeroSrpBError extends AbortOnZeroSrpError {
  constructor() {
    super(ErrorMessages.ABORT_ON_ZERO_SRP_B);
  }
}

export class AbortOnZeroSrpUError extends AbortOnZeroSrpError {
  constructor() {
    super(ErrorMessages.ABORT_ON_ZERO_SRP_U);
  }
}

export class IncorrectCognitoChallengeError extends Error {
  constructor(received?: string) {
    super(`${ErrorMessages.INCORRECT_COGNITO_CHALLENGE} ${received}`);
  }
}
