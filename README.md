# 🔐 Cognito SRP Helper

A JavaScript helper class used to calculate the values required for SRP authentication in AWS Cognito

If you've ever tried to use the in-built SRP authentication flows in Cognito (either through USER_SRP_AUTH or CUSTOM_AUTH) using initiateAuth or respondToAuthChallenge, you may have encountered holes in the documentation that don't explain specific fields (SRP_A, TIMESTAMP, PASSWORD_CLAIM_SIGNATURE). You may also notice that there are no SDK functions that will generate values for these fields, leaving you stuck and unable to progress. This helper class was created to bridge the missing support for SRP authentication in AWS Cognito, providing functions that will handle the necessary calculations needed to complete the authentication flow

## Usage

Here is an example of how you would use the helper class to implement SRP using the AWS SDK:

```js
import CognitoSrpHelper from "cognito-srp-helper";

// . . . obtain user credentials and setup Cognito client

// Initialise SRP helper
const cognitoSrpHelper = new CognitoSrpHelper();

// Create client srp session
const clientSrpSession = cognitoSrpHelper.createClientSrpSession(
  USERNAME,
  PASSWORD,
  POOL_ID
);

// Initiate SRP auth
const initiateAuthResponse = await cognitoIdentityServiceProvider
  .initiateAuth({
    AuthFlow: "USER_SRP_AUTH",
    AuthParameters: {
      CHALLENGE_NAME: "SRP_A",
      SECRET_HASH, // you may / may not have to pass a SECRET_HASH, depending on your Cognito config
      SRP_A: clientSrpSession.largeA, // Use largeA from clientSrpSession here
      USERNAME,
    },
    ClientId: CLIENT_ID,
  })
  .promise()
  .catch((err) => {
    // . . .
  });

// Create a session out of the response. A ReferenceError will be thrown if any values are missing
const cognitoSrpSession =
  cognitoSrpHelper.createCognitoSrpSession(initiateAuthResponse);

// Create timestamp in format required by Cognito
const timestamp = cognitoSrpHelper.createTimestamp();

// Compute password signature using both sessions and the timestamp
const passwordSignature = cognitoSrpHelper.computePasswordSignature(
  clientSrpSession,
  cognitoSrpSession,
  timestamp
);

// Respond to PASSWORD_VERIFIER challenge with password signature and timestamp
const respondToAuthChallengeResponse = await cognitoIdentityServiceProvider
  .respondToAuthChallenge({
    ClientId: CLIENT_ID,
    ChallengeName: "PASSWORD_VERIFIER",
    ChallengeResponses: {
      PASSWORD_CLAIM_SECRET_BLOCK: cognitoSrpSession.secret, // Use secret from cognitoSrpSession here
      PASSWORD_CLAIM_SIGNATURE: passwordSignature, // Use password signature here
      SECRET_HASH,
      TIMESTAMP: timestamp, // Use timestamp here
      USERNAME,
    },
  })
  .promise()
  .catch((err) => {
    // . . .
  });

// . . . return login tokens from respondToAuthChallenge
```

## API

### `createClientSrpSession`

Creates the required data needed to initiate SRP authentication with AWS Cognito. The public session key `largeA` is passed to `SRP_A` in the initiateAuth call. The rest of the values are used later in `computePasswordSignature` to compute `PASSWORD_CLAIM_SIGNATURE`

**Parameters**

`username` - _string_ - The user's AWS Cognito username

`password` - _string_ - The user's AWS Cognito password

`poolId` - _string_ - The ID of the AWS Cognito user pool the user belongs to

**Returns**:

_ClientSrpSession_ - An object containing client SRP session details required to complete our SRP authentication request

**Throws**:

_AbortOnZeroSrpAError_ - Abort SRP if value of 0 is generated for client public key (A). This is _very_ unlikely to occur (~1/10^77) and is simply a safeguard to protect against the session becoming advertently or inadvertently insecure

---

### `createCognitoSrpSession`

Asserts and bundles the SRP authentication values retrieved from Cognito into a single object that can be passed into createCognitoSrpSession

**Parameters**:

`initiateAuthResponse` - [_InitiateAuthResponse_](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/modules/initiateauthresponse.html) - The response from calling CognitoIdentityServiceProvider's initiateAuth method. Note: initiateAuth should be called using the USER_SRP_AUTH auth flow, or CUSTOM_AUTH auth flow if SRP is used

**Returns**:

_CognitoSrpSession_ - An object containing Cognito SRP session details required to complete our SRP authentication request

**Throws**:

_AbortOnZeroSrpBError_ - Abort SRP if value of 0 is generated for Cognito public key (B). This is _very_ unlikely to occur (~1/10^77) and is simply a safeguard to protect against the session becoming advertently or inadvertently insecure

_IncorrectCognitoChallengeError_ - If the challenge returned from Cognito is not PASSWORD_VERIFIER, then this error is thrown. If your Cognito app integration is configured correctly this shouldn't occur

---

### `createTimestamp`

Generate timestamp in the format required by Cognito: `ddd MMM D HH:mm:ss UTC YYYY`. This timestamp is required when creating the password signature via `computePasswordSignature`, and when responding to the PASSWORD_VERIFIER challenge with `respondToAuthChallenge`. Both the password signature and the `respondToAuthChallenge` need to share the same timestamp

**Returns**:

_string_ - A timestamp in the format required by Cognito

---

### `computePasswordSignature`

Computes the password signature to determine whether the password provided by the user is correct or not. This signature is passed to PASSWORD_CLAIM_SIGNATURE in a respondToAuthChallenge call

**Parameters**:

`clientSrpSession` - _ClientSrpSession_ - Client SRP session object containing user credentials and session keys

`cognitoSrpSession` - _CognitoSrpSession_ - Cognito SRP session object containing public session key, salt, and secret

`timestamp` - _string_ - Timestamp that matches the format required by Cognito

**Returns**:

_string_ - The password signature to pass to PASSWORD_CLAIM_SIGNATURE

**Throws**:

_AbortOnZeroSrpUError_ - Abort SRP if value of 0 is generated for the public key hash (u). This is _very_ unlikely to occur (~1/10^77) and is simply a safeguard to protect against the session becoming advertently or inadvertently insecure

## See Also

- [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - NPM package for the Amplify cognito implementation
- [Amplify](https://github.com/aws-amplify/amplify-js) - Official implementation of Cognito SRP in Amplify
- [AWS SDK Cognito](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html) - Official AWS SDK for Cognito
- [SRP](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol) - Wikipedia article on how SRP is implemented
- [Warrant](https://github.com/capless/warrant) - AWS Cognito SRP helper implemented in Python
