# 🔐 Cognito SRP Helper

Using the CognitoIdentityServiceProvider from the AWS SDK, we can authenticate a user using SRP (secure remote password). SRP can be used for basic password verification using the USER_SRP_AUTH or CUSTOM_AUTH flow. The problem here (and the reason this project exists) is that the SRP logic needs to be implemented by the developer, and there aren't a lot of libraries available to do this for you. The options that are available include:

- [Warrant](https://github.com/capless/warrant) - A Python library that implements the SRP logic for you. This solution works well, but there isn't a JavaScript version we can use with the AWS SDK

- [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - Cognito Identity SDK, which also implements the SRP logic for you. This is [what Amplify uses under the hood](https://github.com/aws-amplify/amplify-js/blob/main/packages/amazon-cognito-identity-js/src/AuthenticationHelper.js). The problem with this package is the setup and interface. To setup you either have to download the bundle via NPM and include it via a HTML script tag, or you bundle the package yourself with webpack, which isn't ideal if you don't want to mess with the build config of your project. The interface of the project is also different to the standard [AWS Cognito SDK](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html). If you're already using the standard SDK it may clutter your code if you have to refer to another seperate SDK to interact with Cognito

This package will implement the SRP logic for you, without the need to stray away from the AWS SDK

## Usage

Here is an example of how you would use the helper class to implement SRP using the AWS SDK:

```js
import CognitoSrpHelper from "cognito-srp-helper";

// . . . obtain user credentials and setup Cognito client

// Initialise helper
const cognitoSrpHelper = new CognitoSrpHelper();

// Create a client session
const clientSession = cognitoSrpHelper.createClientSession(
  username,
  password,
  poolId
);

// Initiate password verification with challenge SRP_A
const initiateAuthResponse = await cognito
  .initiateAuth({
    AuthFlow: "USER_SRP_AUTH", // NOTE: also works with CUSTOM_AUTH
    AuthParameters: {
      CHALLENGE_NAME: "SRP_A",
      SRP_A: clientSession.largeA, // Pass the large A from client session
      USERNAME: username,
    },
    ClientId: clientId,
  })
  .promise();

// Create a server session
const { SALT, SECRET_BLOCK, SRP_B } = initiateAuthResponse.ChallengeParameters;
const serverSession = cognitoSrpHelper.createServerSession(
  SRP_B,
  SALT,
  SECRET_BLOCK
);

// Use the client and server session to calculate password claim
const passwordSignature = cognitoSrpHelper.computePasswordSignature(
  clientSession,
  serverSession
);

// Verify password with passwordSignature
const respondToAuthChallengeResponse = await cognito
  .respondToAuthChallenge({
    ChallengeName: "PASSWORD_VERIFIER",
    ChallengeResponses: {
      PASSWORD_CLAIM_SECRET_BLOCK: serverSession.secret, // Pass the secret from server session
      PASSWORD_CLAIM_SIGNATURE: passwordSignature, // Pass signature we calculated before
      TIMESTAMP: clientSession.timestamp, // Pass the timestamp from client session
      USERNAME: username,
    },
    ClientId: clientId,
    Session: initiateAuthResponse.Session,
  })
  .promise();

// . . . return login tokens or continue custom authentication flow
```

## API

### `createClientSession`

Creates the required data needed to initiate SRP authentication with AWS Cognito. The public session key `largeA` is passed to `SRP_A` in the initiateAuth call, `timestamp` is passed to TIMESTAMP in respondToAuthChallenge. The rest of the values are used later to compute the `PASSWORD_CLAIM_SIGNATURE` when responding to a `PASSWORD_VERIFICATION` challenge with `respondToAuthChallenge`

**Parameters**

`username` - _string_ - The user's AWS Cognito username

`password` - _string_ - The user's AWS Cognito password

`poolId` - _string_ - The ID of the AWS Cognito user pool the user belongs to

**Returns**:

`clientSession` - _ClientSession_ - An object containing client details for a SRP authentication request

### `createServerSession`

Asserts and bundles the SRP authentication values retrieved from Cognito into a single object that can be passed into `createServerSession`

**Parameters**:

`largeB` - _string_ - The server's (Cognito's) public session key

`salt` - _string_ - Value paired with user's password to ensure it's unqiue

`secret` - _string_ - A secret value used to authenticate our verification request

**Returns**:

`serverSession` - _ServerSession_ - An object containing server details required to complete our SRP authentication request

### `computePasswordSignature`

Computes the password signature to determine whether the password provided by the user is correct or not. This signature is passed to `PASSWORD_CLAIM_SIGNATURE` in a `respondToAuthChallenge` call

**Parameters**:

`clientSession` - _ClientSession_ - Client session object containing user credentials, session keys, and timestamp

`serverSession` - _ServerSession_ - Server session object containing public session key, salt, and secret

**Returns**:

`passwordSignature` - _string_

## See Also

- [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - NPM package for the Amplify cognito implementation
- [Amplify](https://github.com/aws-amplify/amplify-js) - Official implementation of Cognito SRP in Amplify
- [AWS SDK Cognito](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html) - Official AWS SDK for Cognito
- [SRP](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol) - Wikipedia article on how SRP is implemented
- [Warrant](https://github.com/capless/warrant) - AWS Cognito SRP helper implemented in Python
