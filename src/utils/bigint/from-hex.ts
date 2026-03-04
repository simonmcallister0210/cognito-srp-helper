import bigIntFromString from "./from-string";

/**
 * Converts a hexadecimal string to a bigint. This is shorthande for bigIntFromString with a radix of 16.
 * @param value - The hexadecimal string to convert.
 * @returns The bigint representation of the hexadecimal string.
 * @throws Will throw an error if the input string is not a valid hexadecimal number.
 */
const bigIntFromHex = (value: string): bigint => {
  return bigIntFromString(value, 16);
};

export default bigIntFromHex;
