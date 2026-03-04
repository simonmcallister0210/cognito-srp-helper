const bigIntGenerateRandomModule = { __esModule: true, default: jest.fn(() => "big int unset") };
const base64GenerateRandomModule = { __esModule: true, default: jest.fn(() => "base64 unset") };

jest.mock("@/utils/hex/generate-random", () => bigIntGenerateRandomModule);

jest.mock("@/utils/base64/generate-random", () => base64GenerateRandomModule);

import { deviceRandomPassword, deviceSaltBytes } from "@/__tests__/mocks/data";
import { mockDeviceVerifierFactory, mockInitiateAuthResponseWithNewDeviceFactory } from "@/__tests__/mocks/factories";
import { positiveInitiateAuthResponseWithNewDevice as positiveResponses } from "@/__tests__/test-cases";
import { createDeviceVerifier } from "@/cognito-srp-helper";

describe("createDeviceVerifier", () => {
  beforeEach(() => {
    jest.resetModules();
  });
  describe("positive", () => {
    it("should create the correct device hash", async () => {
      const response = mockInitiateAuthResponseWithNewDeviceFactory();

      base64GenerateRandomModule.default.mockReturnValueOnce(deviceRandomPassword);
      bigIntGenerateRandomModule.default.mockReturnValueOnce(deviceSaltBytes.replace(/[g-z].*$/, ""));

      const { DeviceKey, DeviceGroupKey } = response.AuthenticationResult?.NewDeviceMetadata ?? {};
      if (!DeviceKey) throw Error("DeviceKey is undefined");
      if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

      const verifier = await createDeviceVerifier(DeviceKey, DeviceGroupKey);
      const expected = mockDeviceVerifierFactory();

      expect(verifier).toEqual(expected);
    });

    it.each(Object.values(positiveResponses))(
      "should create a device verifier with the correct format: response %#",
      async (response) => {
        const { DeviceKey, DeviceGroupKey } = response.AuthenticationResult?.NewDeviceMetadata ?? {};
        if (!DeviceKey) throw Error("DeviceKey is undefined");
        if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

        base64GenerateRandomModule.default.mockReturnValueOnce(deviceRandomPassword);
        bigIntGenerateRandomModule.default.mockReturnValueOnce(deviceSaltBytes.replace(/[g-z].*$/, ""));

        const verifier = await createDeviceVerifier(DeviceKey, DeviceGroupKey);

        expect(verifier.DeviceRandomPassword).toMatch(/^[A-Za-z0-9+=/]+$/);
        expect(verifier.DeviceSecretVerifierConfig.PasswordVerifier).toMatch(/^[A-Za-z0-9+=/]+$/);
        expect(verifier.DeviceSecretVerifierConfig.Salt).toMatch(/^[A-Za-z0-9+=/]+$/);
      },
    );
  });
});
