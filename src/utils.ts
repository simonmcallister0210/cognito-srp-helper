import CryptoJS, { SHA256 } from "crypto-js";
import { BigInteger } from "jsbn";

export const hash = (buf: Buffer | string): string => {
  const str = buf instanceof Buffer ? CryptoJS.lib.WordArray.create(buf) : buf;
  const hashHex = SHA256(str).toString();
  const completeHash = new Array(64 - hashHex.length).join("0") + hashHex;

  return completeHash;
};

export const hexHash = (hexStr: string): string => {
  const hexHash = hash(Buffer.from(hexStr, "hex"));
  return hexHash;
};

export const padHex = (bigInt: BigInteger): string => {
  if (!(bigInt instanceof BigInteger)) {
    throw new Error("Not a BigInteger");
  }

  const isNegative = bigInt.compareTo(BigInteger.ZERO) < 0;

  // Get a hex string for abs(bigInt)
  let hexStr = bigInt.abs().toString(16);

  // Pad hex to even length if needed
  hexStr = hexStr.length % 2 !== 0 ? `0${hexStr}` : hexStr;

  // Prepend "00" if the most significant bit is set
  const HEX_MSB_REGEX = /^[89a-f]/i;
  hexStr = HEX_MSB_REGEX.test(hexStr) ? `00${hexStr}` : hexStr;

  if (isNegative) {
    // Flip the bits of the representation
    const invertedNibbles = hexStr
      .split("")
      .map((x) => {
        const invertedNibble = ~parseInt(x, 16) & 0xf;
        return "0123456789ABCDEF".charAt(invertedNibble);
      })
      .join("");

    // After flipping the bits, add one to get the 2's complement representation
    const flippedBitsBI = new BigInteger(invertedNibbles, 16).add(
      BigInteger.ONE
    );

    hexStr = flippedBitsBI.toString(16);

    /*
        For hex strings starting with 'FF8', 'FF' can be dropped, e.g. 0xFFFF80=0xFF80=0x80=-128

        Any sequence of '1' bits on the left can always be substituted with a single '1' bit
        without changing the represented value.

        This only happens in the case when the input is 80...00
    */
    if (hexStr.toUpperCase().startsWith("FF8")) {
      hexStr = hexStr.substring(2);
    }
  }

  return hexStr;
};

throw new Error("foobar");

export const randomBytes = (nBytes: number): Buffer => {
  const bytes = Buffer.from(
    CryptoJS.lib.WordArray.random(nBytes).toString(),
    "hex"
  );

  return bytes;
};
