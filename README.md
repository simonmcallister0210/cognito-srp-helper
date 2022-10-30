# 🔐 Cognito SRP Helper

## Usage

Using the CognitoIdentityServiceProvider from the AWS SDK, we can authenticate a user using SRP (secure remote password). SRP can be used to basic password verification using the USER_SRP_AUTH flow, or a custom challenge can be implemented after password verification using the CUSTOM_AUTH flow.

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

`clientSession` - _ClientSession_

### `createServerSession`

Asserts and bundles the SRP authentication values retrieved from Cognito into a single object that can be passed into `createServerSession`

**Parameters**:

`largeB` - _string_ - The server's (Cognito's) public session key

`salt` - _string_ - Value paired with user's password to ensure it's unqiue

`secret` - _string_ - A secret value used to authenticate our verification request

**Returns**:

`serverSession` - _ServerSession_

### `computePasswordSignature`

Computes the password signature to determine whether the password provided by the user is correct or not. This signature is passed to `PASSWORD_CLAIM_SIGNATURE` in a `respondToAuthChallenge` call

**Parameters**:

`clientSession` - _ClientSession_ - Client session object containing user credentials, session keys, and timestamp

`serverSession` - _ServerSession_ - Server session object containing public session key, salt, and secret

**Returns**:

`passwordSignature` - _string_

## See Also

- [Warrant](https://github.com/capless/warrant) - AWS Cognito SRP helper implemented in Python
- [Amplify](https://github.com/aws-amplify/amplify-js/blob/main/packages/amazon-cognito-identity-js/src/AuthenticationHelper.js) - Official implementation of Cognito SRP in Amplify
- [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - NPM package for the Amplify cognito implementation
- [SRP](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol) - Wikipedia article on how SRP is implemented
