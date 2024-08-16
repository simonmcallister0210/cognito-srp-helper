import type {
  AdminInitiateAuthRequest,
  AdminInitiateAuthResponse,
  AdminRespondToAuthChallengeRequest,
  AdminRespondToAuthChallengeResponse,
  AuthFlowType,
  ChallengeNameType,
  DeviceSecretVerifierConfigType,
  InitiateAuthRequest as ClientInitiateAuthRequest,
  InitiateAuthResponse as ClientInitiateAuthResponse,
  RespondToAuthChallengeRequest as ClientRespondToAuthChallengeRequest,
  RespondToAuthChallengeResponse as ClientRespondToAuthChallengeResponse,
} from "@aws-sdk/client-cognito-identity-provider";

/* Things you should be aware of:
   - In v2 of the SDK AuthFlow and ChallengeName can be specified as a string, but can't be undefined
   - In v3 they have to be a AuthFlowType, but can be undefined
   
   Here we're just making the types more flexibile so that our request/response wrappers don't complain in TS

   Apart from that the request and response types are identical between SDK versions, including their command variants
   so we can get away with using the base type from @aws-sdk/client-cognito-identity-provider as a jumping off point
*/

/**
 * Either InitiateAuthRequest or AdminInitiateAuthRequest from `@aws-sdk/client-cognito-identity-provider`. Should be compatible with SDK v2 and Command forms of the request
 */
export type InitiateAuthRequest =
  | (Omit<ClientInitiateAuthRequest, "AuthFlow"> & { AuthFlow?: AuthFlowType | string })
  | (Omit<AdminInitiateAuthRequest, "AuthFlow"> & { AuthFlow?: AuthFlowType | string });

/**
 * Either InitiateAuthResponse or AdminInitiateAuthResponse from `@aws-sdk/client-cognito-identity-provider`. Should be compatible with SDK v2 and Command forms of the request
 */
export type InitiateAuthResponse =
  | (Omit<ClientInitiateAuthResponse, "ChallengeName"> & { ChallengeName?: ChallengeNameType | string })
  | (Omit<AdminInitiateAuthResponse, "ChallengeName"> & { ChallengeName?: ChallengeNameType | string });

/**
 * Either RespondToAuthChallengeRequest or AdminRespondToAuthChallengeRequest from `@aws-sdk/client-cognito-identity-provider`. Should be compatible with SDK v2 and Command forms of the request
 */
export type RespondToAuthChallengeRequest =
  | (Omit<ClientRespondToAuthChallengeRequest, "ChallengeName"> & {
      ChallengeName?: ChallengeNameType | string;
    })
  | (Omit<AdminRespondToAuthChallengeRequest, "ChallengeName"> & {
      ChallengeName?: ChallengeNameType | string;
    });

/**
 * Either RespondToAuthChallengeResponse or AdminRespondToAuthChallengeResponse from `@aws-sdk/client-cognito-identity-provider`. Should be compatible with SDK v2 and Command forms of the response
 */
export type RespondToAuthChallengeResponse =
  | (Omit<ClientRespondToAuthChallengeResponse, "ChallengeName"> & {
      ChallengeName?: ChallengeNameType | string;
    })
  | (Omit<AdminRespondToAuthChallengeResponse, "ChallengeName"> & {
      ChallengeName?: ChallengeNameType | string;
    });

/**
 * Credentials needed for SRP authentication
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

/**
 * An object containing the DeviceSecretVerifierConfig required for the ConfirmDeviceCommand step,
 * and DeviceRandomPassword used for to generate the signature for the DEVICE_PASSWORD_VERIFIER step
 */
export type DeviceVerifier = {
  /** The random password associated with a device. Used to generate the password signature for DEVICE_PASSWORD_VERIFIER */
  DeviceRandomPassword: string;
  /** The device verifier used to confirm the device in ConfirmDeviceCommand */
  DeviceSecretVerifierConfig: DeviceSecretVerifierConfigType;
};
