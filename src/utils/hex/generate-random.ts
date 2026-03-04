import hexFromUint8Array from "./from-uint8array";

/**
 * Generates a random hex string of the specified size.
 * @param size The size of the random string in bytes.
 * @returns A random hex string.
 */
const generateRandom = (size: number) => {
  return hexFromUint8Array(crypto.getRandomValues(new Uint8Array(size)));
};

export default generateRandom;
