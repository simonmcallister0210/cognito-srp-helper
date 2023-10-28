Cognito SRP Helper
Copyright 2022 Simon McAllister

This product includes software developed at
Amazon Cognito Identity Provider SDK for JavaScript (https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js)

==== Amazon Cognito Identity Provider SDK for JavaScript ====
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

==== Modifications ====
Modifications to the Amazon Cognito Identity Provider SDK in Cognito SRP Helper:

- Renamed and moved `infoBits`, `N`, `g`, `k` properties in `AuthenticationHelper.js` to `constants.ts`
- Renamed and moved `generateRandomSmallA`, `calculateA`, `calculateU`, `computehkdf`, `calculateS`
- Moved `hash`, `hexHash`, `padHex`, `randomBytes` functions from `AuthenticationHelper.js` to `util.ts`
- Modified functions to remove callbacks
- Modified functions to use new constants
- Modified functions to use `crypto-js` library for HMAC, WordArrays, and Base64 encoding
- Modified functions to use `jsbn` library instead of `BigInteger`
- Modified functions to throw custom errors for easier error handling
- Use version `6.0.3` of `buffer` library
