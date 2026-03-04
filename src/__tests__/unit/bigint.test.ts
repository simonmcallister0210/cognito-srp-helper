import { absBigInt, bigIntFromHex, bigIntFromString, generateRandomBigInt, modPowBigInt } from "@/utils/bigint";

describe("bigint", () => {
  describe("absBigInt", () => {
    it("makes no change to a positive number", async () => {
      expect(absBigInt(1n)).toEqual(1n);
    });

    it("makes no change to 0", async () => {
      expect(absBigInt(0n)).toBe(0n);
    });

    it("makes negative number positive", async () => {
      expect(absBigInt(-2n)).toBe(2n);
    });
  });

  describe("bigIntFromHex", () => {
    it("creates bigint from 0", async () => {
      expect(bigIntFromHex("0").toString()).toBe("0");
    });

    it("creates bigint from f", async () => {
      expect(bigIntFromHex("f").toString()).toBe("15");
    });

    // NOTE: bigIntFromString doesn't handle overflow
    it("creates bigint from g", async () => {
      expect(bigIntFromHex("g").toString()).toBe("16");
    });

    it("creates bigint from 10", async () => {
      expect(bigIntFromHex("10").toString()).toBe("16");
    });

    // NOTE: bigIntFromString doesn't handle overflow
    it("creates bigint from 1g", async () => {
      expect(bigIntFromHex("1h").toString()).toBe("17");
    });
  });

  describe("bigIntFromString", () => {
    it("creates bigint from 0", async () => {
      expect(bigIntFromString("0", 16).toString()).toBe("0");
    });

    it("creates bigint from f", async () => {
      expect(bigIntFromString("f", 16).toString()).toBe("15");
    });

    // NOTE: bigIntFromString doesn't handle overflow
    it("creates bigint from g", async () => {
      expect(bigIntFromString("g", 16).toString()).toBe("16");
    });

    it("creates bigint from 10", async () => {
      expect(bigIntFromString("10", 16).toString()).toBe("16");
    });

    // NOTE: bigIntFromString doesn't handle overflow
    it("creates bigint from 1g", async () => {
      expect(bigIntFromString("1h", 16).toString()).toBe("17");
    });
  });

  describe("generateRandomBigInt", () => {
    beforeEach(() => {
      jest.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
        if (!array) return array;

        return new Uint8Array([array.buffer.byteLength]);
      });
    });

    it("returns the size of the requested array", async () => {
      expect(generateRandomBigInt(3).toString()).toBe("3");
      expect(generateRandomBigInt(10).toString()).toBe("10");
      expect(generateRandomBigInt(16).toString()).toBe("16");
    });
  });

  describe("modPowBigInt", () => {
    it("returns the correct value", async () => {
      expect(modPowBigInt(5n, 3n, 13n).toString()).toBe("8");
    });
  });
});
