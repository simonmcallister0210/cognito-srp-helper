import generateRandomHex from "@/utils/hex/generate-random";

import bigIntFromString from "./from-string";

/**
 * Generates a random bigint of the specified size in bytes.
 * @param size The size of the bigint in bytes.
 * @returns A random bigint of the specified size.
 */
const generateRandomBigInt = (size: number): bigint => {
  return bigIntFromString(generateRandomHex(size), 16);
};

export default generateRandomBigInt;
