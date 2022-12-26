export const ABORT_ON_ZERO_SRP_ERR_MSG = "Aborting SRP due to 0 value";
export const ABORT_ON_ZERO_SRP_ERR_MSG_A =
  "Aborting SRP due to 0 value received for client public key (A)";
export const ABORT_ON_ZERO_SRP_ERR_MSG_B =
  "Aborting SRP due to 0 value received for server public key (B)";
export const ABORT_ON_ZERO_SRP_ERR_MSG_U =
  "Aborting SRP due to 0 value received for public key hash (u)";

export class AbortOnZeroSrpError extends Error {
  constructor(message = ABORT_ON_ZERO_SRP_ERR_MSG) {
    super(message);
  }
}

export class AbortOnZeroSrpErrorA extends AbortOnZeroSrpError {
  constructor(message = ABORT_ON_ZERO_SRP_ERR_MSG_A) {
    super(message);
  }
}

export class AbortOnZeroSrpErrorB extends AbortOnZeroSrpError {
  constructor(message = ABORT_ON_ZERO_SRP_ERR_MSG_B) {
    super(message);
  }
}

export class AbortOnZeroSrpErrorU extends AbortOnZeroSrpError {
  constructor(message = ABORT_ON_ZERO_SRP_ERR_MSG_U) {
    super(message);
  }
}
