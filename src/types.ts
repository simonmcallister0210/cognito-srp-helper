import { CognitoIdentityServiceProvider } from "aws-sdk";

/**
 * Type alias for CognitoIdentityServiceProvider.InitiateAuthResponse
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/modules/initiateauthresponse.html
 */
export type InitiateAuthResponse =
  CognitoIdentityServiceProvider.InitiateAuthResponse;

/**
 * Client SRP session object. This object contains the user's credentials,
 * unique session keys. Using these details we can initiate an SRP request to
 * validate the user's password via AWS Cognito
 */
export type ClientSrpSession = {
  /** Username of the user. It is stored here for convenience when passing parameters into `computePasswordSignature` */
  username: string;
  /** Abbreviated ID of the Cognito Userpool. Here it is just the succeeding ID that's used e.g. 'eu-west-2_abc123' becomes 'abc123' */
  poolIdAbbr: string;
  /** Password hash generated using the users credentials */
  passwordHash: string;
  /** Client's private session key */
  smallA: string;
  /** Client's public session key */
  largeA: string;
};

/**
 * Cognito SRP session object. After initiating SRP authentication with AWS
 * Cognito using the data provided by `ClientSrpSession`, Cognito will return
 * these three values that we can use to compute the signature for our password
 */
export type CognitoSrpSession = {
  /** Server's public session key */
  largeB: string;
  /** Server's session salt */
  salt: string;
  /** Server's session secret  */
  secret: string;
};
