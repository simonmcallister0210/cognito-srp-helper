/**
 * Client credentials object. Contains data required to authorise a user using
 * SRP in AWS Cognito
 */
export type Credentials = {
  /** The username associated with the user in a Cognito Userpool */
  username: string;
  /** The password associated with the user in a Cognito Userpool */
  password: string;
  /** The ID of the Cognito Userpool. Must be full ID e.g. eu-west-2_abc123 */
  poolId: string;
};

/**
 * Client session object. This object contains the user's credentials, unique
 * session keys, and a Cognito compatible timestamp from when the session was
 * created. Using these details we can initiate an SRP request to validate
 * the user's password via AWS Cognito.
 */
export type ClientSession = {
  /** Username of the user. The is the value that is in the `Credentials` object. It is bundled here for convenience when passing parameters into `computePasswordSignature` */
  username: string;
  /** ID of the Cognito Userpool. Here it is just the succeeding ID that's used e.g. abc123 */
  poolId: string;
  /** Password hash generated using the users credentials */
  passwordHash: string;
  /** Private client session key */
  smallA: string;
  /** Public client session key */
  largeA: string;
};

/**
 * Cognito session object. After initiating SRP authentication with AWS
 * Cognito using the data provided by `ClientSession`, Cognito will return
 * three values that we can use to compute the signature for our password.
 */
export type CognitoSession = {
  /** Public server session key */
  largeB: string;
  /** Server session salt */
  salt: string;
  /** Server session secret  */
  secret: string;
};
