import { Buffer } from "buffer/";

import { createDeviceVerifier } from "../../cognito-srp-helper";
import * as utils from "../../utils";
import { deviceRandomPasswordBytes, deviceSaltBytes } from "../mocks/data";
import { mockDeviceVerifierFactory, mockInitiateAuthResponseWithNewDeviceFactory } from "../mocks/factories";
import { positiveInitiateAuthResponseWithNewDevice as positiveResponses } from "../test-cases";

describe("createDeviceVerifier", () => {
  describe("positive", () => {
    it("should create the correct device hash", () => {
      const response = mockInitiateAuthResponseWithNewDeviceFactory();

      // ensure randomBytes returns what we expect
      jest.spyOn(utils, "randomBytes").mockReturnValueOnce(Buffer.from(deviceRandomPasswordBytes, "hex"));
      jest.spyOn(utils, "randomBytes").mockReturnValueOnce(Buffer.from(deviceSaltBytes, "hex"));

      const { DeviceKey, DeviceGroupKey } = response.AuthenticationResult?.NewDeviceMetadata ?? {};
      if (!DeviceKey) throw Error("DeviceKey is undefined");
      if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

      const verifier = createDeviceVerifier(DeviceKey, DeviceGroupKey);
      const expected = mockDeviceVerifierFactory();
      expect(verifier).toEqual(expected);
    });

    it.each(Object.values(positiveResponses))(
      "should create a device verifier with the correct format: response %#",
      (response) => {
        const { DeviceKey, DeviceGroupKey } = response.AuthenticationResult?.NewDeviceMetadata ?? {};
        if (!DeviceKey) throw Error("DeviceKey is undefined");
        if (!DeviceGroupKey) throw Error("DeviceGroupKey is undefined");

        const verifier = createDeviceVerifier(DeviceKey, DeviceGroupKey);

        expect(verifier.DeviceRandomPassword).toMatch(/^[A-Za-z0-9+=/]+$/);
        expect(verifier.DeviceSecretVerifierConfig.PasswordVerifier).toMatch(/^[A-Za-z0-9+=/]+$/);
        expect(verifier.DeviceSecretVerifierConfig.Salt).toMatch(/^[A-Za-z0-9+=/]+$/);
      },
    );
  });
});
