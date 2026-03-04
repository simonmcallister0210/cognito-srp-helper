/**
 * Create a Unit8Array from a base64 string.
 * @param value The base64 string to convert to a Uint8Array.
 * @returns A Uint8Array parsed from the base64 string.
 */
function uint8ArrayFromBase64(value: string): Uint8Array {
  return Uint8Array.fromBase64(value);
}

export default uint8ArrayFromBase64;
