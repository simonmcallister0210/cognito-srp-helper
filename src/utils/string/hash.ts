import uint8ArrayFromString from "@/utils/uint8array/from-string";
import hashUint8Array from "@/utils/uint8array/hash";

/**
 * Creates a hash from a string. IF YOU ARE HASHING A HEX VALUE, YOU SHOULD
 * USE HASHHEX WHICH CONVERTS TWO DIGITS TO A SINGLE BYTE.
 * @param value - The string to hash.
 * @returns The hash of the string.
 */
const hashString = (value: string) => {
  return hashUint8Array(uint8ArrayFromString(value));
};

export default hashString;
