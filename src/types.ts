/**
 * Client session object. This object contains the user's credentials, unique
 * session keys, and a Cognito compatible timestamp from when the session was
 * created. Using these details we can initiate an SRP request to validate
 * the user's password via AWS Cognito.
 */
export type ClientSession = {
  username: string;
  poolId: string;
  passwordHash: string;
  smallA: string;
  largeA: string;
  timestamp: string;
};

/**
 * Server session object. After initiating SRP authentication with AWS
 * Cognito using the data provided by `ClientSession`, Cognito will return
 * three values that we can use to compute the signature for our password.
 */
export type ServerSession = {
  largeB: string;
  salt: string;
  secret: string;
};
