/**
 * Converts a Uint8Array to a hexadecimal string where each byte represents
 * two hexidecimal digits.
 * @param value - The Uint8Array to convert.
 * @returns The hexadecimal string representation of the Uint8Array.
 */
const hexFromUint8Array = (value: Uint8Array): string => {
  return value.toHex();
};

export default hexFromUint8Array;
