import type {
  AdminInitiateAuthCommandInput,
  AdminInitiateAuthCommandOutput,
  AdminInitiateAuthRequest as AdminInitiateAuthRequestV3,
  AdminInitiateAuthResponse as AdminInitiateAuthResponseV3,
  AdminRespondToAuthChallengeCommandInput,
  AdminRespondToAuthChallengeRequest as AdminRespondToAuthChallengeRequestV3,
  InitiateAuthCommandInput,
  InitiateAuthCommandOutput,
  InitiateAuthRequest as InitiateAuthRequestV3,
  InitiateAuthResponse as InitiateAuthResponseV3,
  RespondToAuthChallengeCommandInput,
  RespondToAuthChallengeRequest as RespondToAuthChallengeRequestV3,
} from "@aws-sdk/client-cognito-identity-provider";
import type { CognitoIdentityServiceProvider } from "aws-sdk";

/**
 * The AWS SDK v2 and v3 have multiple ways of calling the `initiateAuth` operation. For example, you have ...
 *
 * - v2 InitiateAuthRequest
 * - v3 InitiateAuthRequest
 * - v3 InitiateAuthCommandInput
 *
 * ... and they all have "Admin" versions. The good news is they all share the same shape, so to simplify the interface
 * we've unioned all these types into a single type called InitiateAuthRequest, which can be used in place of any of
 * these variations
 *
 * Below are the types that can be used:
 *
 * ### SDK V2:
 *
 * `CognitoIdentityServiceProvider.InitiateAuthRequest`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#initiateAuth-property
 *
 * `CognitoIdentityServiceProvider.AdminInitiateAuthRequest`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminInitiateAuth-property
 *
 * ### SDK V3
 *
 * `InitiateAuthRequest` (aliased as `InitiateAuthRequestV3`):
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/InitiateAuthRequest/
 *
 * `AdminInitiateAuthRequest` (aliased as `AdminInitiateAuthRequestV3`):
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminInitiateAuthRequest/
 *
 * `InitiateAuthCommandInput`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/InitiateAuthCommandInput/
 *
 * `AdminInitiateAuthCommandInput`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminInitiateAuthCommandInput/
 */
export type InitiateAuthRequest =
  // v2
  | CognitoIdentityServiceProvider.InitiateAuthRequest
  | CognitoIdentityServiceProvider.AdminInitiateAuthRequest
  // v3
  | InitiateAuthRequestV3
  | AdminInitiateAuthRequestV3
  | InitiateAuthCommandInput
  | AdminInitiateAuthCommandInput;

/**
 * The AWS SDK v2 and v3 have multiple ways of responding to the `initiateAuth` operation. For example, you have ...
 *
 * - v2 InitiateAuthResponse
 * - v3 InitiateAuthResponse
 * - v3 InitiateAuthCommandOutput
 *
 * ... and they all have "Admin" versions. The good news is they all share the same shape, so to simplify the interface
 * we've unioned all these types into a single type called InitiateAuthResponse, which can be used in place of any of
 * these variations
 *
 * Below are the types that can be used:
 *
 * ### SDK V2:
 *
 * `CognitoIdentityServiceProvider.InitiateAuthResponse`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#initiateAuth-property
 *
 * `CognitoIdentityServiceProvider.AdminInitiateAuthResponse`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminInitiateAuth-property
 *
 * ### SDK V3:
 *
 * `InitiateAuthResponse` (aliased as `InitiateAuthResponseV3`):
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/InitiateAuthResponse/
 *
 * `AdminInitiateAuthResponse` (aliased as `AdminInitiateAuthResponseV3`):
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminInitiateAuthResponse/
 *
 * `InitiateAuthCommandOutput`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/InitiateAuthCommandOutput/
 *
 * `AdminInitiateAuthCommandOutput`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminInitiateAuthCommandOutput/
 */
export type InitiateAuthResponse =
  // v2
  | CognitoIdentityServiceProvider.InitiateAuthResponse
  | CognitoIdentityServiceProvider.AdminInitiateAuthResponse
  // v3
  | InitiateAuthResponseV3
  | AdminInitiateAuthResponseV3
  | InitiateAuthCommandOutput
  | AdminInitiateAuthCommandOutput;

/**
 * The AWS SDK v2 and v3 have multiple ways of responding to the `respondToAuthChallenge` operation. For example, you
 * have ...
 *
 * - v2 RespondToAuthChallengeRequest
 * - v3 RespondToAuthChallengeRequest
 * - v3 RespondToAuthChallengeCommandInput
 *
 * ... and they all have "Admin" versions. The good news is they all share the same shape, so to simplify the interface
 * we've unioned all these types into a single type called RespondToAuthChallengeRequest, which can be used in place of
 * any of these variations
 *
 * Below are the types that can be used:
 *
 * ### SDK V2:
 *
 * `CognitoIdentityServiceProvider.RespondToAuthChallengeRequest`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#respondToAuthChallenge-property
 *
 * `CognitoIdentityServiceProvider.AdminRespondToAuthChallengeRequest`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminRespondToAuthChallenge-property
 *
 * ### SDK V3:
 *
 * `RespondToAuthChallengeRequest` (aliased as `RespondToAuthChallengeRequestV3`):
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/RespondToAuthChallengeRequest/
 *
 * `AdminRespondToAuthChallengeRequest` (aliased as `AdminRespondToAuthChallengeRequestV3`):
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminRespondToAuthChallengeRequest/
 *
 * `RespondToAuthChallengeCommandInput`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/RespondToAuthChallengeCommandInput/
 *
 * `AdminRespondToAuthChallengeCommandInput`:
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminRespondToAuthChallengeCommandInput/
 */
export type RespondToAuthChallengeRequest =
  // v2
  | CognitoIdentityServiceProvider.RespondToAuthChallengeRequest
  | CognitoIdentityServiceProvider.AdminRespondToAuthChallengeRequest
  // v3
  | RespondToAuthChallengeRequestV3
  | AdminRespondToAuthChallengeRequestV3
  | RespondToAuthChallengeCommandInput
  | AdminRespondToAuthChallengeCommandInput;

/**
 * Credentials needed for SRP authentication.
 */
export type Credentials = {
  sub: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  poolId: string;
  clientId: string;
  secretId: string;
  secretHash: string;
  passwordHash: string;
};

/**
 * SRP session object. This object contains the user's credentials, public and
 * private keys. Using these details we can initiate an SRP request to verify
 * the user's password via AWS Cognito
 */
export type SrpSession = {
  /** Username of the user. It is stored here for convenience when passing parameters into `computePasswordSignature` */
  username: string;
  /** Password used for authentication */
  password: string;
  /** Flag indicating whether the password has already been hashed */
  isHashed: boolean;
  /** Full un-abbreviated ID of the Cognito Userpool. Here it is the full ID that's used e.g. 'eu-west-2_abc123' */
  poolId: string;
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
