# 🔐 Cognito SRP Helper

Using the CognitoIdentityServiceProvider from the AWS SDK, we can authenticate a user without sending their password to the server. This is done through SRP (secure remote password). SRP can be used for password verification using the USER_SRP_AUTH or CUSTOM_AUTH flow. The problem here (and the reason this project exists) is that the SRP logic needs to be implemented by the developer, and there aren't many libraries available to do this for you. The options that are available include:

- [Warrant](https://github.com/capless/warrant) - A Python library that implements the SRP logic for you. This solution works well, but there isn't a JavaScript version we can use with the AWS SDK

- [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - Cognito Identity SDK, which also implements the SRP logic for you. This is [what Amplify uses under the hood](https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js). The problem with this package is the setup and interface. To setup you either have to download the bundle via NPM and include it via a HTML script tag, or you bundle the package yourself with webpack, which isn't ideal if you don't want to mess with the build config of your project. The interface of the project is also different to the standard [AWS Cognito SDK](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html). If you're already using the standard SDK it may clutter your code if you have to refer to another seperate SDK to interact with Cognito

This package will implement the SRP logic for you in JavsScript, without the need to stray away from the AWS SDK. It mimics the official AWS SRP implementation from [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js), but improves on it by removing the need for callbacks, and removing its internal state, making more readable, testable, and re-usable

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
      SECRET_HASH,
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
const respondToAuthChallenge = await cognitoIdentityServiceProvider
  .respondToAuthChallenge({
    ClientId: CLIENT_ID,
    ChallengeName: "PASSWORD_VERIFIER",
    ChallengeResponses: {
      PASSWORD_CLAIM_SECRET_BLOCK: cognitoSrpSession.secret, // Use secret from cognitoSrpSession here
      PASSWORD_CLAIM_SIGNATURE: passwordSignature, // Use timestamp here
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

_AbortOnZeroSrpError_ - Abort SRP if value of 0 is generated for client public key (A). This is _very_ unlikely to occur (~1/10^77) and is simply a safeguard to protect against the session becoming advertently or inadvertently insecure

### `createCognitoSrpSession`

Asserts and bundles the SRP authentication values retrieved from Cognito into a single object that can be passed into createCognitoSrpSession

**Parameters**:

`initiateAuthResponse` - [_InitiateAuthResponse_](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/modules/initiateauthresponse.html) - The response from calling CognitoIdentityServiceProvider's initiateAuth method. Note: initiateAuth should be called using the USER_SRP_AUTH auth flow, or CUSTOM_AUTH auth flow if SRP is used

**Returns**:

_CognitoSrpSession_ - An object containing Cognito SRP session details required to complete our SRP authentication request

**Throws**:

_AbortOnZeroSrpError_ - Abort SRP if value of 0 is generated for Cognito public key (B). This is _very_ unlikely to occur (~1/10^77) and is simply a safeguard to protect against the session becoming advertently or inadvertently insecure

_IncorrectCognitoChallengeError_ - If the challenge returned from Cognito is not PASSWORD_VERIFIER, then this error is thrown

### `createTimestamp`

Generate timestamp in the format required by Cognito: `ddd MMM D HH:mm:ss UTC YYYY`. This timestamp is required when creating the password signature via `computePasswordSignature`, and when responding to the PASSWORD_VERIFIER challenge with `respondToAuthChallenge`. Both the password signature and the `respondToAuthChallenge` need to share the same timestamp

**Returns**:

_string_ - A timestamp in the format required by Cognito

### `computePasswordSignature`

Computes the password signature to determine whether the password provided by the user is correct or not. This signature is passed to PASSWORD_CLAIM_SIGNATURE in a respondToAuthChallenge call

**Parameters**:

`clientSrpSession` - _ClientSrpSession_ - Client SRP session object containing user credentials and session keys

`cognitoSrpSession` - _CognitoSrpSession_ - Cognito SRP session object containing public session key, salt, and secret

`timestamp` - _string_ - Timestamp that matches the format required by Cognito

**Returns**:

_string_ - The password signature to pass to PASSWORD_CLAIM_SIGNATURE

**Throws**:

_AbortOnZeroSrpError_ - Abort SRP if value of 0 is generated for the public key hash (u). This is _very_ unlikely to occur (~1/10^77) and is simply a safeguard to protect against the session becoming advertently or inadvertently insecure

## See Also

- [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - NPM package for the Amplify cognito implementation
- [Amplify](https://github.com/aws-amplify/amplify-js) - Official implementation of Cognito SRP in Amplify
- [AWS SDK Cognito](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html) - Official AWS SDK for Cognito
- [SRP](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol) - Wikipedia article on how SRP is implemented
- [Warrant](https://github.com/capless/warrant) - AWS Cognito SRP helper implemented in Python
