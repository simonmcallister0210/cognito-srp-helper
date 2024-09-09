import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createSecretHash } from "../../cognito-srp-helper";
import { CognitoIdentityServiceProvider } from "aws-sdk";

type SignupOptionsV2 = {
  username: string;
  password: string;
  cognitoIdentityServiceProvider: CognitoIdentityServiceProvider;
  clientId: string;
  secretId: string;
};

export const signupV2 = async (options: SignupOptionsV2) => {
  const { username, password, cognitoIdentityServiceProvider, clientId, secretId } = options;
  const secretHash = createSecretHash(username, clientId, secretId);

  return cognitoIdentityServiceProvider
    .signUp({
      ClientId: clientId,
      Username: username,
      Password: password,
      SecretHash: secretHash,
    })
    .promise();
};

type SignupOptionsV3 = {
  username: string;
  password: string;
  cognitoIdentityProviderClient: CognitoIdentityProviderClient;
  clientId: string;
  secretId: string;
};

export const signupV3 = async (options: SignupOptionsV3) => {
  const { username, password, cognitoIdentityProviderClient, clientId, secretId } = options;
  const secretHash = createSecretHash(username, clientId, secretId);

  await cognitoIdentityProviderClient
    .send(
      // There's a pre-signup trigger to auto-confirm new users, so no need to Confirm post signup
      new SignUpCommand({
        ClientId: clientId,
        Username: username,
        Password: password,
        SecretHash: secretHash,
      }),
    )
    .catch((err) => {
      throw err;
    });
};
