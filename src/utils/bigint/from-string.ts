const calculateBitsForRadix = (radix: number): bigint => {
  let bits = 0; // signed bit
  for (let r = radix; r > 1; r >>= 1) {
    bits += 1;
  }
  return BigInt(bits);
};

/**
 * Converts a string to a bigint using the specified radix. The string should only contain characters that are valid for the given radix.
 * @param value The string to convert to a bigint.
 * @param radix The radix to use for conversion. Must be between 2 and 36.
 * @returns A bigint representing the converted string.
 * @throws Will throw an error if the radix is out of range or if the string contains invalid characters for the given radix.
 */
function bigIntFromString(value: string, radix: number): bigint {
  const bitsPerCharacter = calculateBitsForRadix(radix);
  let out = BigInt(0);

  for (let i = 0; i < value.length; i++) {
    const charCode = BigInt(parseInt(value[i], 36));
    out <<= bitsPerCharacter;
    out |= charCode;
  }

  return out;
}

export default bigIntFromString;
