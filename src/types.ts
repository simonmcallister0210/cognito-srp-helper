import { CognitoIdentityServiceProvider } from "aws-sdk";

/**
 * Type alias for CognitoIdentityServiceProvider.InitiateAuthResponse
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/modules/initiateauthresponse.html
 */
export type InitiateAuthResponse =
  CognitoIdentityServiceProvider.InitiateAuthResponse;

/**
 * Type alias for CognitoIdentityServiceProvider.InitiateAuthRequest
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/modules/initiateauthrequest.html
 */
export type InitiateAuthRequest =
  CognitoIdentityServiceProvider.InitiateAuthRequest;

/**
 * Type alias for CognitoIdentityServiceProvider.RespondToAuthChallengeRequest
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/modules/respondtoauthchallengerequest.html
 */
export type RespondToAuthChallengeRequest =
  CognitoIdentityServiceProvider.RespondToAuthChallengeRequest;

/**
 * SRP session object. This object contains the user's credentials, public and
 * private keys. Using these details we can initiate an SRP request to verify
 * the user's password via AWS Cognito
 */
export type SrpSession = {
  /** Username of the user. It is stored here for convenience when passing parameters into `computePasswordSignature` */
  username: string;
  /** Password hash generated using the users credentials */
  passwordHash: string;
  /** Abbreviated ID of the Cognito Userpool. Here it is just the succeeding ID that's used e.g. 'eu-west-2_abc123' becomes 'abc123' */
  poolIdAbbr: string;
  /** Timestamp captured in the format requiree for Cogntio */
  timestamp: string;
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
export type SrpSessionSigned = SrpSession & {
  /** Server's public session key */
  largeB: string;
  /** Server's session salt */
  salt: string;
  /** Server's session secret  */
  secret: string;
  /** The signatire used to verify the user's password */
  passwordSignature: string;
};
