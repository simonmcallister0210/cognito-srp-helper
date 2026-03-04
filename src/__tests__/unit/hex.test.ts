import { generateRandomHex, hashHex, hexFromBigInt, hexFromUint8Array } from "@/utils/hex";

describe("hex", () => {
  describe("hexFromUint8Array", () => {
    it("creates hex from 0", async () => {
      expect(hexFromUint8Array(new Uint8Array([0])).toString()).toBe("00");
    });

    it("creates hex from f", async () => {
      expect(hexFromUint8Array(new Uint8Array([15])).toString()).toBe("0f");
    });

    it("creates hex from 10", async () => {
      expect(hexFromUint8Array(new Uint8Array([16])).toString()).toBe("10");
    });
  });

  describe("generateRandomHex", () => {
    beforeEach(() => {
      jest.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
        if (!array) return array;

        return new Uint8Array([array.buffer.byteLength]);
      });
    });

    it("returns the size of the requested array", async () => {
      expect(generateRandomHex(3).toString()).toBe("03");
      expect(generateRandomHex(10).toString()).toBe("0a");
      expect(generateRandomHex(16).toString()).toBe("10");
    });
  });

  describe("hashHex", () => {
    // Verified using https://emn178.github.io/online-tools/sha256.html
    it("works", async () => {
      const value = await hashHex("0f");
      await expect(value).toEqual("dc0e9c3658a1a3ed1ec94274d8b19925c93e1abb7ddba294923ad9bde30f8cb8");
    });
  });

  describe("hexFromBigInt", () => {
    it("creates a padded hex string from a 0n", async () => {
      expect(hexFromBigInt(0n, true)).toBe("00");
    });

    it("creates a padded hex string from a 3n", async () => {
      expect(hexFromBigInt(3n, true)).toBe("03");
    });

    it("creates a padded hex string from a 15n", async () => {
      expect(hexFromBigInt(15n, true)).toBe("0f");
    });

    it("creates a padded hex string from a 16n", async () => {
      expect(hexFromBigInt(16n, true)).toBe("10");
    });
  });
});
