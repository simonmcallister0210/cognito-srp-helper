# Usage

Password verification using custom authentication flow:

``` js
import CognitoSrpHelper from "cognito-srp-helper";
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Initialise helper with user's credential and Cognito pool ID
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

// . . . continue custom authentication flow with your custom challenges
```

# API

## `__constructor`

**Parameters:**

`username` - *string* - Username of the user you want to authenticate

`password` - *string* - Password of the user you want to authenticate

`poolId` - *string* - The ID of the Cognito user pool the user belongs to

**Returns:**

*CognitoSrpHelper*

---

## `getEphemeralKey`

**Returns**:

*string*

---

## `getPasswordSignature`

**Parameters**:

`serverEphemeralKey` - *string*

`serverSecretBlock` - *string*

`serverSalt` - *string*

**Returns**:

*string*

---

## `getTimeStamp`

**Returns**:

*string*

