/**
 * Convert a Uint8Array to base64.
 * @param value The Uint8Array to convert.
 * @returns The base64 string representation of the Uint8Array.
 */
const base64FromUint8Array = (value: Uint8Array): string => {
  return value.toBase64();
};

export default base64FromUint8Array;
