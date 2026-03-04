/**
 * Computes the HMAC-SHA256 of the given input keying material (IKM) and salt.
 * HKDF is a simple key derivation function (KDF) based on the HMAC message authentication code.
 * @param ikm - The input keying material as a Uint8Array.
 * @param salt - The salt as a Uint8Array.
 * @returns A Promise that resolves to the computed HMAC-SHA256 as a Uint8Array.
 */
export const computeHmacSha256 = async (ikm: Uint8Array, salt: Uint8Array): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey("raw", salt as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, ikm as BufferSource);

  return new Uint8Array(sig);
};

export default computeHmacSha256;
