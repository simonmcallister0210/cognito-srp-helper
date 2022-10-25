# 🔐 Cognito SRP Helper

## Usage

Password verification using custom authentication flow:

``` js
import CognitoSrpHelper from "cognito-srp-helper";
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Initialise helper with user's credentials and Cognito pool ID
const cognitoSrpHelper = new CognitoSrpHelper(
    username,
    password,
    poolId
);
const cognito = CognitoIdentityServiceProvider({
    region: "eu-west-2"
})

// Initiate password verification with challenge SRP_A
const initiateAuthResponse = await cognito.initiateAuth({
    AuthFlow: 'CUSTOM_AUTH',
    AuthParameters: {
        CHALLENGE_NAME: 'SRP_A',
        PASSWORD: password,
        // SRP_A generated when CognitoSrpHelper is initialised
        SRP_A: cognitoSrpHelper.getEphemeralKey(),
        USERNAME: username,
    },
    ClientId: clientId,
});

// Extract secret values, and use them to generate PASSWORD_CLAIM_SIGNATURE
const { SALT, SECRET_BLOCK, SRP_B } = initiateAuthResponse.ChallengeParameters;
const passwordClaimSignature = cognitoSrpHelper.getPasswordSignature(
    SRP_B,
    SECRET_BLOCK,
    SALT
);

// Verify password with passwordClaimSignature 
const respondToAuthChallengeResponse = await cognito.respondToAuthChallenge({
    ChallengeName: 'PASSWORD_VERIFIER',
    ChallengeResponses: {
        PASSWORD_CLAIM_SECRET_BLOCK: SECRET_BLOCK,
        PASSWORD_CLAIM_SIGNATURE: passwordClaimSignature,
        // TIMESTAMP generated when CognitoSrpHelper is initialised
        TIMESTAMP: cognitoSrpHelper.getTimeStamp(),
        USERNAME: username,
    },
    ClientId: clientId,
    Session: initiateAuthResponse.Session,
})

// . . . continue custom authentication flow
```

## API

### `__constructor`

**Parameters:**

`username` - *string* - Username of the user you want to authenticate

`password` - *string* - Password of the user you want to authenticate

`poolId` - *string* - The ID of the Cognito user pool the user belongs to

**Returns:**

*CognitoSrpHelper*

### `getEphemeralKey`

Provides the client ephemeral key SRP_A needed to initiate authentication. The key is a hexadecimal string representing a large random integer

**Returns**:

*string*

### `getPasswordSignature`

Generates the signature required for PASSWORD_CLAIM_SIGNATURE in respondToAuthChallenge. The signature is generated using the secret values returned from initiateAuth. 

**Parameters**:

`serverEphemeralKey` - *string* - The SRP_B value returned from initiateAuth

`serverSecretBlock` - *string* - The SECRET_BLOCK value returned from initiateAuth

`serverSalt` - *string* - The SALT value returned from initiateAuth

**Returns**:

*string*

### `getTimeStamp`

Provides a timestamp in the specific format required for Cognito: *DDD MMM DD HH:MM:SS UTC YYYY*, for example *Sun Oct 23 17:02:22 UTC 2022*. The timestamp is generated when CognitoSrpHelper object is initialised. This value is passed to TIMESTAMP in respondToAuthChallenge

**Returns**:

*string*

## See Also

* [Warrant](https://github.com/capless/warrant) - AWS Cognito SRP helper implemented in Python
* [Amplify](https://github.com/aws-amplify/amplify-js/blob/main/packages/amazon-cognito-identity-js/src/AuthenticationHelper.js) - Official implementation of Cognito SRP in Amplify
* [amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) - NPM package for the Amplify cognito implementation
* [SRP](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol) - Wikipedia article on how SRP is implemented
