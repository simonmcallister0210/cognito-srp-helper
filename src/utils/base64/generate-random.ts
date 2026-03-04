import base64FromUint8Array from "./from-uint8array";

/**
 * Generates a random base64 string of the specified size in bytes.
 * @param size The size of the random data in bytes.
 * @returns A base64 string representing the random data.
 */
const generateRandomBase64 = (size: number): string => {
  return base64FromUint8Array(crypto.getRandomValues(new Uint8Array(size)));
};

export default generateRandomBase64;
