#!/usr/bin/node

const AWS = require("aws-sdk");
const CognitoSrpHelper = require("./dist").default;

(async () => {
  const cognitoSrpHelper = new CognitoSrpHelper();

  const username = "username";
  const password = "password";
  const poolId = "eu-west-2_bBpjKlyj6";
  const clientId = "4rot6srbd36jrqk1turg5udr9m";

  // deterministic values
  // const timestamp = 949374245000; // Tuesday, 1 February 2000 03:04:05
  // const a = "abcdef0123456789";

  //   const salt = "8f6a1dad94d7b82c5e3031d21a251b0f";
  //   const secret =
  //     "20CSZ/4dP2vvE+TqpIKUEsd9Dg9HcyfY7CBfhdLi3glQtycSzAUxBbKPgPm9qZ25MtDzH4TD6kYl6LmvXvhe11PN9mXbuJ/VVjrj3U6tGZP4flJZrcQ6hwkJsMoP3DbHreIg/pvBd91+T1I8X7oo5aC/l2DBTRKjSWIr1OppGjXT/MhurL0oOQY3v8IDvH6EtlMnTGBO0qfLqfoPrOMHrdWC+7drAi473WbpXiLvPqjUhfCAw7napnYhDj6qcUPNz3SSpBNhs/+nfLsR9ds8KCYbTslRzdo+x+1OHmLXzvzXgQcY9ibOzcIQd3YIJxScjyaW0EzNKF9UbRNj3e7PBNhXNiJEQ6DTVDOi9o4c9Z3DNQlFgQmrJSom2MwSx76kDX9JlnQrPuEailMJvG1n5oe/I0MpycWt6Xn1F4zSTVUR8gyX88a65SbcBlAPzPS4FToM5HJLss8W+9NZbtGslj/MU5phdiEFHSPidXfGSzd0brsZ8FjjL+hiA2bfut4I9FBpPtjQKTIyTfv0micyvQiywDksz2e1mjE2hG+igZf3aAuw7hnuj/EOai6cy52qxOnnJ9bq0qqNjka61dF4Vcm+MxqzIlDdh6uk5OMWWhzG03uwdy2qlem3gDQmHsLe5E5HqaSGAOzgf2BbkDibNsQslMHnakv1m9vAk07wswdxUVhAXGxJruj02A51L5nsooNv6bg8JNgi1p/r2zjcvCQQFzlYSuEJwIUEm05BZxekSoJdbycAfZIfbNKx/grHpAvHRViRGru0DU2sqi7zBmToULho016T9rQmqPFoLJu52JsOKnM2Jh1GHsyfc4yvLlarLqPMYu65n2LxI+ZZAtnzYQkoF7lnQ7cKocc5kKWGEhA+kAlAsUK2282MPZ7wgjQoZ05aDxa2HC5bAILQLrJvCC5cFFvpawvA/zm5OfbfYxK2Vxye/A7ts0TluLRqYp6J43dNJwqMLD2UxOD+wu7PcnthUgs9f0TD4VFKy2LSkkVIVfChn8fNvjg678SN3g1XqjOnEc9k8x6TAf830q8auYsW8xBK0ik23N57HsbYqse7P3ec5P3Wo4HJyXl75nDDh9PH+2frxSpI2qcZSAe3Csfst4gKlPz1guRs35+9izOc6hZ0jKohVhkpgtRHNhSBmxewmWMardIZYSlzSEJPztLm7wghWGuO/l4yWUsltPKmI6RpRdDnbcpkcZw+7qGc+DVkyLTHp5eyaeqW6DD3S0S6HpkeaqYlOQSBjgYMJCbOBV3UEfq6IW7xsPs2SA/m1esie7KuF9bdazEozL0fymp3qutdkWKTSv9fJ/3KoVCYCEpE70B8DqQTF2XaZ/nqa88ku/dkN78b+CdGLMiZ/eUCq+DN/w7TBwmOhtP3ckqBrA3xv0y+XOriSfD/Ws793dNcliq4u7UItgOHFwZfH+A3mZ2SuF2Tpm2zexr+tGdwgE3ut/0NC1qRaeIo52ySE0V812xv1grzrQ7QkKOhCb3J7ijWmesIFM41avk2j2S2+xGEWHxgYHSKABTK0bTpG0it0FHra04qRLNJE4p1n4RekbN9TZrWagajRItYnrHWzZpvXAC7RpO6foUktiITJqS9mLMttLXruV0lkWk6QzUzDfW87fsdrV3haqEN9DLt0RtOIjZDcI98qkwllBz4c3sev2pCMhPQPkNYA7gi65550R//3JrOTThBATY6gmsWF0nLzMM6";
  //   const largeB =
  //     "d8403b0f5e3f6b58d80ed99a65d588133e915203af440b83d90174f7d2cf52469d3686addbde759a2c6561231a2b4bb2d7bffc2adbc32f188a1f543e8a4af9500d9e0fb236c4ac68585b6b968e4b86a7f5564e3be0478a76660eeefd736d68b25f349b34acc9d123eb38d8307db7c5fdf6e74d2173cc66f1a7cf71b7a0c79669a588aa9dcd66def830e63e6d09fd435bce9a4caef0c4dc497ec97da9b65c0785d16e6d61a3f536ba2fa01a7e159c74b8d3cc65beaa0d7d750bc7caf1745bfac408a333eddccca9fe64e6948c9194dcab7944adfeea98befd1dd110b8c4878eba589c6aa7779f485e3334f57240bb138cbba3cbf7a4ae7653b8621db27ccb34120c6259c55c1009928b4f9155c156d6ece2c98e973aa72097feab4d5732f026726e81d28e0ad4481aa37d04ba1161ff6b1439ee7c2127197628e68127c899d3117e4b9ae54d9619db35314178bea8932470084fdf29f7752a29360530e30de0b8d28db566ebfce62e7a08a402f23a5c8801189d4a484b925ff9c03de7b72f7c79";

  const cognitoIdentityClient = new AWS.CognitoIdentityServiceProvider({
    region: "eu-west-2",
  });
  const clientSession = cognitoSrpHelper.createClientSession(
    username,
    password,
    poolId
  );

  const initiateAuthResponse = await cognitoIdentityClient
    .initiateAuth({
      AuthFlow: "USER_SRP_AUTH",
      AuthParameters: {
        USERNAME: username,
        CHALLENGE_NAME: "SRP_A",
        SRP_A: clientSession.largeA,
      },
      ClientId: clientId,
    })
    .promise()
    .catch((err) => {
      console.error(err);
    });
  console.log("== initiateAuthResponse ==");
  console.log(initiateAuthResponse);

  const { SRP_B, SALT, SECRET_BLOCK } =
    initiateAuthResponse.ChallengeParameters;
  const cognitoSession = cognitoSrpHelper.createCognitoSession(
    SRP_B,
    SALT,
    SECRET_BLOCK
  );
  const signatureString = cognitoSrpHelper.computePasswordSignature(
    clientSession,
    cognitoSession
  );

  const respondToAuthChallenge = await cognitoIdentityClient
    .respondToAuthChallenge({
      ClientId: clientId,
      ChallengeName: "PASSWORD_VERIFIER",
      ChallengeResponses: {
        TIMESTAMP: clientSession.timestamp,
        USERNAME: username,
        PASSWORD_CLAIM_SECRET_BLOCK: cognitoSession.secret,
        PASSWORD_CLAIM_SIGNATURE: signatureString,
      },
    })
    .promise()
    .catch((err) => {
      console.error(err);
    });
  console.log("== respondToAuthChallenge ==");
  console.log(respondToAuthChallenge);

  console.log("== clientSession ==");
  console.log(clientSession);
  console.log("== cognitoSession ==");
  console.log(cognitoSession);
  console.log("== signatureString ==");
  console.log(signatureString);

  console.log("== done ==");
})();
