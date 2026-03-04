import uint8ArrayFromHex from "@/utils/uint8array/from-hex";
import hashUint8Array from "@/utils/uint8array/hash";

/**
 * Calculate a hash from a hex string
 * @param value Value to hash.
 * @returns Hex-encoded hash stringh.
 */
const hashHex = (value: string): Promise<string> => {
  return hashUint8Array(uint8ArrayFromHex(value));
};

export default hashHex;
