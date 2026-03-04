export {};

declare global {
  // Types copied from Tyepscript 6. REMOVE AFTER UPGRADE.
  // https://github.com/microsoft/typescript-go/pull/1680/changes#diff-1988ceccd756f94b3715777c9edee841ff2bbfaa9395690c9fab5e668424db6fR63-R104

  interface Uint8ArrayConstructor {
    /**
     * Creates a new `Uint8Array` from a base64-encoded string.
     * @param string The base64-encoded string.
     * @param options If provided, specifies the alphabet and handling of the last chunk.
     * @returns A new `Uint8Array` instance.
     * @throws {SyntaxError} If the input string contains characters outside the specified alphabet, or if the last
     * chunk is inconsistent with the `lastChunkHandling` option.
     */
    fromBase64(
      string: string,
      options?: {
        alphabet?: "base64" | "base64url";
        lastChunkHandling?: "loose" | "strict" | "stop-before-partial";
      },
    ): Uint8Array;

    /**
     * Creates a new `Uint8Array` from a base16-encoded string.
     * @returns A new `Uint8Array` instance.
     */
    fromHex(string: string): Uint8Array;
  }

  interface Uint8Array {
    /**
     * Converts the `Uint8Array` to a base64-encoded string.
     * @param options If provided, sets the alphabet and padding behavior used.
     * @returns A base64-encoded string.
     */
    toBase64(options?: { alphabet?: "base64" | "base64url"; omitPadding?: boolean }): string;

    /**
     * Sets the `Uint8Array` from a base64-encoded string.
     * @param string The base64-encoded string.
     * @param options If provided, specifies the alphabet and handling of the last chunk.
     * @returns An object containing the number of bytes read and written.
     * @throws {SyntaxError} If the input string contains characters outside the specified alphabet, or if the last
     * chunk is inconsistent with the `lastChunkHandling` option.
     */
    setFromBase64(
      string: string,
      options?: {
        alphabet?: "base64" | "base64url";
        lastChunkHandling?: "loose" | "strict" | "stop-before-partial";
      },
    ): {
      read: number;
      written: number;
    };

    /**
     * Converts the `Uint8Array` to a base16-encoded string.
     * @returns A base16-encoded string.
     */
    toHex(): string;

    /**
     * Sets the `Uint8Array` from a base16-encoded string.
     * @param string The base16-encoded string.
     * @returns An object containing the number of bytes read and written.
     */
    setFromHex(string: string): {
      read: number;
      written: number;
    };
  }
}
