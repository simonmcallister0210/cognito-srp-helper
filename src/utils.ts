/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/*
  CHANGES:
  In the Amplify implementation, they use their own private implementation of
  BigInteger, but this is just a small copy of: http://www-cs-students.stanford.edu/~tjw/jsbn/
  This code is packaged by jsbn, so we'll use that instead. They also use their
  own implementation of WordArray, but we use CryptoJS for this instead
*/

import CryptoJS, { SHA256 } from "crypto-js";
import { BigInteger } from "jsbn";

/**
 * Calculate a hash from a bitArray
 * @param {Buffer} buf Value to hash.
 * @returns {String} Hex-encoded hash.
 */
export const hash = (buf: Buffer | string): string => {
  const str = buf instanceof Buffer ? CryptoJS.lib.WordArray.create(buf) : buf;
  const hashHex = SHA256(str).toString();
  const completeHash = new Array(64 - hashHex.length).join("0") + hashHex;

  return completeHash;
};

/**
 * Calculate a hash from a hex string
 * @param {String} hexStr Value to hash.
 * @returns {String} Hex-encoded hash.
 */
export const hexHash = (hexStr: string): string => {
  const hexHash = hash(Buffer.from(hexStr, "hex"));
  return hexHash;
};

/**
 * Returns an unambiguous, even-length hex string of the two's complement
 * encoding of an integer.
 *
 * It is compatible with the hex encoding of Java's BigInteger's toByteArray(),
 * which returns a byte array containing the two's-complement representation of
 * a BigInteger. The array contains the minimum number of bytes required to
 * represent the BigInteger, including at least one sign bit.
 *
 * Examples showing how ambiguity is avoided by left padding with:
 * 	"00" (for positive values where the most-significant-bit is set)
 *  "FF" (for negative values where the most-significant-bit is set)
 *
 * padHex(bigInteger.fromInt(-236))  === "FF14"
 * padHex(bigInteger.fromInt(20))    === "14"
 *
 * padHex(bigInteger.fromInt(-200))  === "FF38"
 * padHex(bigInteger.fromInt(56))    === "38"
 *
 * padHex(bigInteger.fromInt(-20))   === "EC"
 * padHex(bigInteger.fromInt(236))   === "00EC"
 *
 * padHex(bigInteger.fromInt(-56))   === "C8"
 * padHex(bigInteger.fromInt(200))   === "00C8"
 *
 * @param {BigInteger} bigInt Number to encode.
 * @returns {String} even-length hex string of the two's complement encoding.
 */
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
      For hex strings starting with 'FF8', 'FF' can be dropped, e.g.
      0xFFFF80=0xFF80=0x80=-128

      Any sequence of '1' bits on the left can always be substituted with a
      single '1' bit without changing the represented value.

      This only happens in the case when the input is 80...00
    */
    if (hexStr.toUpperCase().startsWith("FF8")) {
      hexStr = hexStr.substring(2);
    }
  }

  return hexStr;
};

/**
 * Returns a Buffer with a sequence of random nBytes
 *
 * @param {number} nBytes
 * @returns {Buffer} fixed-length sequence of random bytes
 */
export const randomBytes = (nBytes: number): Buffer => {
  const bytes = Buffer.from(
    CryptoJS.lib.WordArray.random(nBytes).toString(),
    "hex"
  );

  return bytes;
};
