import hexFromUint8Array from "@/utils/hex/from-uint8array";

/**
 * Hash a Uint8Array using SHA-256 and return the result as a hexadecimal string.
 * @param value - The Uint8Array to be hashed.
 * @returns A promise that resolves to the hexadecimal string representation of the hash.
 */
const hashUint8Array = async (value: Uint8Array): Promise<string> => {
  const hashBinary = await crypto.subtle.digest("SHA-256", value as BufferSource);
  const hashHex = hexFromUint8Array(new Uint8Array(hashBinary));
  const completeHash = new Array(64 - hashHex.length).join("0") + hashHex;

  return completeHash;
};

export default hashUint8Array;
