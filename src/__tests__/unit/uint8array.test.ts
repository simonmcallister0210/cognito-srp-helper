import { hashUint8Array, uint8ArrayFromBase64, uint8ArrayFromHex, uint8ArrayFromString } from "@/utils/uint8array";

describe("uint8array", () => {
  describe("uint8arrayFromString", () => {
    it("works", async () => {
      expect(uint8ArrayFromString("test")).toEqual(
        new Uint8Array(["t".charCodeAt(0), "e".charCodeAt(0), "s".charCodeAt(0), "t".charCodeAt(0)]),
      );
    });
  });

  describe("uint8arrayFromHex", () => {
    it("works with single digit ", async () => {
      expect(uint8ArrayFromHex("f")).toEqual(new Uint8Array([15]));
    });

    it("works with two digits", async () => {
      expect(uint8ArrayFromHex("1f")).toEqual(new Uint8Array([31]));
    });

    it("works with four digits", async () => {
      expect(uint8ArrayFromHex("1f1f")).toEqual(new Uint8Array([31, 31]));
    });

    it("works with three digits", async () => {
      expect(uint8ArrayFromHex("f1f")).toEqual(new Uint8Array([15, 31]));
    });

    it("works with three digits and a zero", async () => {
      expect(uint8ArrayFromHex("0f1f")).toEqual(new Uint8Array([15, 31]));
    });

    //it("has acceptable speed", async () => {
    //  const now = performance.now();
    //  for (let i = 0; i < 1_000_000; i++) {
    //    uint8ArrayFromHex("0f1f");
    //  }
    //  const end = performance.now();
    //  console.log(`Time taken: ${end - now}ms`); // Currently 504.37291599999935ms
    //});
  });

  describe("uint8arrayFromBase64", () => {
    it("works", async () => {
      expect(uint8ArrayFromBase64(btoa("test"))).toEqual(
        new Uint8Array(["t".charCodeAt(0), "e".charCodeAt(0), "s".charCodeAt(0), "t".charCodeAt(0)]),
      );
    });
  });

  describe("hashUint8Array", () => {
    it("works", async () => {
      // Verified using https://emn178.github.io/online-tools/sha256.html
      const value = await hashUint8Array(
        new Uint8Array(["t".charCodeAt(0), "e".charCodeAt(0), "s".charCodeAt(0), "t".charCodeAt(0)]),
      );
      await expect(value).toEqual("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
    });
  });
});
