const encoder = new TextEncoder();
/**
 * Converts a string to a Uint8Array. DO NOT USE THIS FUNCTION
 * FOR BASE64 OR HEX STRINGS as they require parsing.
 * @param value - The string to convert.
 * @returns A Uint8Array representing the input string.
 */
const uint8ArrayFromString = (value: string): Uint8Array => {
  return encoder.encode(value);
};

export default uint8ArrayFromString;
