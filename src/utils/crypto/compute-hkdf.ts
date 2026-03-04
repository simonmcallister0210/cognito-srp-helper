import hexFromBigInt from "@/utils/hex/from-bigint";
import uint8ArrayFromHex from "@/utils/uint8array/from-hex";

import computeHmacSha256 from "./compute-hmac-sha256";

/**
 * Computes the HMAC-based Extract-and-Expand Key Derivation Function (HKDF) using SHA-256.
 * @param props - An object containing the input keying material (ikm), salt, and info.
 * @returns A Promise that resolves to a Uint8Array containing the derived key.
 */
const computeHkdf = async (props: { ikm: bigint; salt: bigint; info: Uint8Array }): Promise<Uint8Array> => {
  const { ikm, info, salt } = props;
  const ikmHex = hexFromBigInt(ikm, true);
  const saltHex = hexFromBigInt(salt, true);
  const prk = await computeHmacSha256(uint8ArrayFromHex(ikmHex), uint8ArrayFromHex(saltHex));
  const hmac = await computeHmacSha256(info, prk);

  return hmac.slice(0, 16);
};

export default computeHkdf;
