# 🔐 Cognito SRP Helper

JavaScript helper used to calculate the values required for SRP authentication in AWS Cognito

If you've ever tried to use the in-built SRP authentication flows in Cognito (USER_SRP_AUTH or CUSTOM_AUTH) using initiateAuth and respondToAuthChallenge, you may have encountered holes in the documentation that don't explain specific fields (SRP_A, TIMESTAMP, PASSWORD_CLAIM_SIGNATURE). You may also notice that there are no SDK functions that will generate values for these fields, leaving you stuck and unable to progress. This helper was created to bridge the missing support for SRP authentication in AWS Cognito, providing functions that will handle the necessary calculations needed to complete the authentication flow

The helper works by providing functions that generate the required hashes for your secret and password, and wrapping your Cognito request and returning the same request with the required SRP fields. It work's with AWS SDK v2 and v3

## Usage

This is a Hybrid package, so you can use both ES import:

```js
import CognitoSrpHelper from "cognito-srp-helper";
```

Or CommonJS require:

```js
const CognitoSrpHelper = require("cognito-srp-helper");
```

Here is an example of how you would use the helper to implement SRP authentication with Cognito using the AWS JavaScript SDK v3:

```ts
import {
  createSecretHash,
  createPasswordHash,
  createSrpSession,
  signSrpSession,
  wrapAuthChallenge,
  wrapInitiateAuth,
} from "cognito-srp-helper";

// . . . obtain user credentials, IDs, and setup Cognito client

const secretHash = createSecretHash(username, clientId, secretId);
const passwordHash = createPasswordHash(username, password, poolId);
const srpSession = createSrpSession(username, passwordHash, poolId);

const initiateAuthRes = await cognitoIdentityProviderClient
  .send(
    new InitiateAuthCommand(
      wrapInitiateAuth(srpSession, {
        ClientId: CLIENT_ID,
        AuthFlow: "USER_SRP_AUTH",
        AuthParameters: {
          CHALLENGE_NAME: "SRP_A",
          SECRET_HASH: secretHash,
          USERNAME,
        },
      }),
    ),
  )
  .catch((err) => {
    // . . .
  });

const signedSrpSession = signSrpSession(srpSession, initiateAuthRes);

const respondToAuthChallengeRes = await cognitoIdentityProviderClient
  .send(
    new RespondToAuthChallengeCommand(
      wrapAuthChallenge(signedSrpSession, {
        ClientId: CLIENT_ID,
        ChallengeName: "PASSWORD_VERIFIER",
        ChallengeResponses: {
          SECRET_HASH: secretHash,
          USERNAME,
        },
      }),
    ),
  )
  .catch((err) => {
    // . . .
  });

// . . . return login tokens from respondToAuthChallengeResponse
```

Here is an example of how you would use the helper to implement SRP authentication with Cognito using the AWS JavaScript SDK v2 (deprecated):

```ts
import {
  createSecretHash,
  createPasswordHash,
  createSrpSession,
  signSrpSession,
  wrapAuthChallenge,
  wrapInitiateAuth,
} from "cognito-srp-helper";

// . . . obtain user credentials, IDs, and setup Cognito client

const secretHash = createSecretHash(username, clientId, secretId);
const passwordHash = createPasswordHash(username, password, poolId);
const srpSession = createSrpSession(username, passwordHash, poolId);

const initiateAuthRes = await cognitoIdentityServiceProvider
  .initiateAuth(
    wrapInitiateAuth(srpSession, {
      ClientId: CLIENT_ID,
      AuthFlow: "USER_SRP_AUTH",
      AuthParameters: {
        CHALLENGE_NAME: "SRP_A",
        SECRET_HASH: secretHash,
        USERNAME,
      },
    }),
  )
  .promise()
  .catch((err) => {
    throw err;
  });

const signedSrpSession = signSrpSession(srpSession, initiateAuthRes);

const respondToAuthChallengeRes = await cognitoIdentityServiceProvider
  .respondToAuthChallenge(
    wrapAuthChallenge(signedSrpSession, {
      ClientId: CLIENT_ID,
      ChallengeName: "PASSWORD_VERIFIER",
      ChallengeResponses: {
        SECRET_HASH: secretHash,
        USERNAME,
      },
    }),
  )
  .promise()
  .catch((err) => {
    throw err;
  });

// . . . return login tokens from respondToAuthChallengeResponse
```

## API

The types _InitiateAuthRequest_, _InitiateAuthResponse_, _RespondToAuthChallengeRequest_ refer to both the SDK v2 and v3 versions of these types, and their admin variants. For example _InitiateAuthRequest_ can be _AdminInitiateAuthRequest_, _InitiateAuthCommandInput_, etc.

### `createSecretHash`

Generates the required secret hash when a secret is configured for the app client

**Parameters**

`username` - _string_ - The user's username

`clientId` - _string_ - The client ID for the Cognito app

`secretId` - _string_ - The secret ID for the Cognito app

**Returns**:

_string_ - A hash of the secret. This is passed to the SECRET_HASH field

---

### `createPasswordHash`

Generates the required password hash from the user's credentials and user pool ID

> NOTE: pre-hashing the password only works when you're sign-in attribute is Username. If you're using Email or Phone Number you need to use an unhashed password

**Parameters**:

`username` - _string_ - The user's username

`password` - _string_ - The user's password

`poolId` - _string_ - The ID of the user pool the user's credentials are stored in

**Returns**:

_string_ - A hash of the user's password. Used to create an SRP session

---

### `createSrpSession`

Creates an SRP session using the user's credentials and a Cognito user pool ID. This session contains the public/private SRP key for the client, and a timestamp in the unique format required by Cognito. With this session we can add to our public key (SRP_A) to the initiateAuth request

> NOTE: pre-hashing the password only works when you're sign-in attribute is Username. If you're using Email or Phone Number you should set `isHashed` as `false`

`username` - _string_ - The user's username

`password` - _string_ - The user's password

`poolId` - _string_ - The ID of the user pool the user's credentials are stored in

`isHashed` - _boolean_ - A flag indicating whether the password has already been hashed. The default value is `true`

**Returns**:

_SrpSession_ - Client SRP session object containing user credentials and session keys

---

### `signSrpSession`

With a successful initiateAuth call using the USER_SRP_AUTH flow (or CUSTOM_AUTH if SRP is configured) we receive values from Cognito that we can use to verify the user's password. With this response we can 'sign' our session by generating a password signature and attaching it to our session

**Parameters**:

`session` - _SrpSession_ - Client SRP session object containing user credentials and session keys

`response` - _InitiateAuthResponse_ - The Cognito response from initiateAuth. This response contains SRP values (SRP_B, SALT, SECRET_BLOCK) which are used to verify the user's password

**Returns**:

_SrpSessionSigned_ - A signed version of the SRP session object

---

### `wrapInitiateAuth`

Wraps a _InitiateAuthRequest_ and attaches the SRP_A field required to initiate SRP

**Parameters**:

`session` - _SrpSession_ - SRP session object containing user credentials and session keys

`request` - _InitiateAuthRequest_ - The Cognito request passed into initiateAuth

**Returns**:

_InitiateAuthRequest_ - The same request but with the additional SRP_A field

---

### `wrapAuthChallenge`

Wraps a _RespondToAuthChallengeRequest_ and attaches the PASSWORD_CLAIM_SECRET_BLOCK, PASSWORD_CLAIM_SIGNATURE, and TIMESTAMP fields required to complete SRP

**Parameters**:

`session` - _SrpSessionSigned_ - A signed version of the SRP session object

`request` - _RespondToAuthChallengeRequest_ - The Cognito request passed into respondToAuthChallenge

**Returns**:

_RespondToAuthChallengeRequest_ - The same request but with the additional PASSWORD_CLAIM_SECRET_BLOCK, PASSWORD_CLAIM_SIGNATURE, and TIMESTAMP fields

## Password hashing

It's possible to hash the user's password before you create the SRP session. This might be useful if you're calling InitiateAuth from the backend. This step can add an extra layer of security by obfuscating the user's password. To be clear though, the user's password is perfectly secure being transmitted using a secure protocol like HTTPS, this step is entirely optional

Be aware that password hashing will only work if the user's sign-in attribute is Username. If you're using Email or Phone Number the hashing function `createPasswordHash` will not generate a valid hash

## Zero values in SRP

Should you worry about 0 being used during the SRP calculations?

Short answer: no!

Long answer: according to the [safeguards of SRP](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol#Protocol), if a 0 value is given for A, B, or u then the protocol must abort to avoid compromising the security of the exchange. The possible scenarios in which a 0 value is used are:

1. A value of 0 is randomly generated via SHA256 which is _extremely_ unlikely to occur, ~1/10^77
2. A SRP_B value of 0 is received from the Cogntio initiateAuth call, which won't happen unless someone is purposefully trying to compromise security by intercepting the response from Cognito

If any of these scenarios occur this package will throw a `AbortOnZeroSrpError`, so you don't need to worry about the security of the exchange being compromised

## See Also

- [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - NPM package for the Amplify cognito implementation
- [Amplify](https://github.com/aws-amplify/amplify-js) - Official implementation of Cognito SRP in Amplify
- [AWS SDK Cognito](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html) - Official AWS SDK for Cognito
- [SRP](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol) - Wikipedia article on how SRP is implemented
- [Warrant](https://github.com/capless/warrant) - AWS Cognito SRP helper implemented in Python
