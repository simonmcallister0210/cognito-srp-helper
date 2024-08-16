import { faker } from "@faker-js/faker";
import omit from "lodash.omit";
import RandExp from "randexp";

import { InitiateAuthResponse } from "../../types";
import { mockInitiateAuthResponseWithNewDeviceFactory } from "../mocks/factories";

const { ChallengeParameters, AuthenticationResult } = mockInitiateAuthResponseWithNewDeviceFactory();
const { NewDeviceMetadata } = AuthenticationResult ?? {};
if (!NewDeviceMetadata) throw Error("NewDeviceMetadata is undefined");

export const positiveInitiateAuthResponseWithNewDevice: Record<string, InitiateAuthResponse> = {
  default: mockInitiateAuthResponseWithNewDeviceFactory(),
  // largeB
  largeBRandom: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SRP_B: faker.random.alphaNumeric(1024, { casing: "lower" }),
    },
  }),
  largeBShort: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      // 1 / 62 chance to return "0" which will trigger a AbortOnZeroBSrpError, so ban the char
      SRP_B: faker.random.alphaNumeric(1, { casing: "lower", bannedChars: "0" }),
    },
  }),
  largeBLong: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SRP_B: faker.random.alphaNumeric(10000, { casing: "lower" }),
    },
  }),
  // salt
  saltRandom: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(32, { casing: "lower" }),
    },
  }),
  saltShort: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(1, { casing: "lower" }),
    },
  }),
  saltLong: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SALT: faker.random.alphaNumeric(10000, { casing: "lower" }),
    },
  }),
  // secret
  secretRandom: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{1724}$/).gen(),
    },
  }),
  secretShort: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
    },
  }),
  secretLong: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...ChallengeParameters,
      SECRET_BLOCK: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
    },
  }),
  // DeviceGroupKey
  deviceGroupKeyRandom: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...NewDeviceMetadata,
        DeviceGroupKey: new RandExp(/^[A-Za-z0-9+=/]{9}$/).gen(),
      },
    },
  }),
  deviceGroupKeyShort: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...NewDeviceMetadata,
        DeviceGroupKey: new RandExp(/^[A-Za-z0-9+=/]{1}$/).gen(),
      },
    },
  }),
  deviceGroupKeyLong: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...NewDeviceMetadata,
        DeviceGroupKey: new RandExp(/^[A-Za-z0-9+=/]{10000}$/).gen(),
      },
    },
  }),
  // DeviceKey
  deviceKeyRandom: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...NewDeviceMetadata,
        DeviceKey:
          new RandExp(/^(us(-gov)?|ap|ca|cn|eu|sa)-(central|(north|south)?(east|west)?)_$/).gen() +
          faker.datatype.uuid(),
      },
    },
  }),
};

export const negativeInitiateAuthResponseWithNewDevice: Record<string, InitiateAuthResponse> = {
  default: mockInitiateAuthResponseWithNewDeviceFactory(),
  // ChallengeParameters
  challengeParametersUndefined: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: undefined,
  }),
  challengeParametersOmitted: omit(mockInitiateAuthResponseWithNewDeviceFactory(), "ChallengeParameters"),
  // salt
  saltOmitted: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SALT"),
    },
  }),
  // secret
  secretOmitted: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SECRET_BLOCK"),
    },
  }),
  // largeB
  largeBOmitted: mockInitiateAuthResponseWithNewDeviceFactory({
    ChallengeParameters: {
      ...omit(ChallengeParameters, "SRP_B"),
    },
  }),
  // AuthenticationResult
  authenticationResultUndefined: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: undefined,
  }),
  authenticationResultOmitted: omit(mockInitiateAuthResponseWithNewDeviceFactory(), "AuthenticationResult"),
  // NewDeviceMetadata
  newDeviceMetadataUndefined: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: undefined,
    },
  }),
  newDeviceMetadataOmitted: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: omit(AuthenticationResult, "NewDeviceMetadata"),
  }),
  // DeviceGroupKey
  deviceGroupKeyUndefined: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...NewDeviceMetadata,
        DeviceGroupKey: undefined,
      },
    },
  }),
  deviceGroupKeyOmitted: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...omit(NewDeviceMetadata, "DeviceGroupKey"),
      },
    },
  }),
  // DeviceKey
  deviceKeyUndefined: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...NewDeviceMetadata,
        DeviceKey: undefined,
      },
    },
  }),
  deviceKeyOmitted: mockInitiateAuthResponseWithNewDeviceFactory({
    AuthenticationResult: {
      NewDeviceMetadata: {
        ...omit(NewDeviceMetadata, "DeviceKey"),
      },
    },
  }),
};
