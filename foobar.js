#!/usr/bin/node

const imports = require("./dist");
const { padHex } = require("./dist/utils");
const BigInteger = require("jsbn").default;
const CryptoJS = require("crypto-js");
const HmacSHA256 = require("crypto-js/hmac-sha256");

const USERNAME = "username";
const PASSWORD = "password";
const POOL_ID = "123456";
const SALT = "1234567890abcdef";
const SECRET = "secret";

const srp = new imports.default(USERNAME, PASSWORD, `region_${POOL_ID}`);
const G = imports.G;
const N = imports.N;
const K = imports.K;

// Server B value
// Steve → Carol: generate random value b; send s and B = kv + gb
const usernamePassword = `${POOL_ID}${USERNAME}:${PASSWORD}`;
const usernamePasswordHash = imports.hash(usernamePassword);
const b = new BigInteger("123456", 16);
console.log("b");
console.log(b.toString(16));
const x = srp.calculateX(new BigInteger(SALT, 16), usernamePasswordHash);
console.log("x");
console.log(x.toString(16));
const v = G.modPow(x, N);
console.log("v");
console.log(v.toString(16));
const B = K.multiply(v).add(G.modPow(b, N));
console.log("B");
console.log(B.toString(16));

// console.log("imports");
// console.log(imports);
// console.log("x");
// console.log(x.toString(16));
// console.log("v");
// console.log(v.toString(16));
// console.log("B");
// console.log(B.toString(16));

// Server S and K Value
// Steve: SSteve = (Avu)b = (gavu)b = [ga(gx)u]b = (ga + ux)b = (gb)(a + ux)
// Steve: KSteve = H(SSteve) = KCarol
const A = new BigInteger(srp.getEphemeralKey(), 16);
const U = srp.calculateU(A, B);
console.log("U");
console.log(U.toString(16));
// const S = A.multiply(v).modPow(U, N).modPow(b, N);
// const S = A.multiply(v.modPow(v, U, N)).modPow(b, N);
const vModPowUN = v.modPow(U, N);
const intVal1 = A.multiply(vModPowUN);
const S = intVal1.modPow(b, N);
console.log("S");
console.log(S.toString(16));
const hkdf = srp.computeHkdf(
  Buffer.from(padHex(S), "hex"),
  Buffer.from(padHex(U), "hex")
);
console.log("hkdf");
console.log(hkdf.toString("utf-8"));
const key = CryptoJS.lib.WordArray.create(hkdf);
const message = CryptoJS.lib.WordArray.create(
  Buffer.concat([
    Buffer.from(POOL_ID, "utf8"),
    Buffer.from(USERNAME, "utf8"),
    Buffer.from(SECRET, "base64"),
    Buffer.from(srp.getTimeStamp(), "utf8"),
  ])
);
const signatureString = CryptoJS.enc.Base64.stringify(HmacSHA256(message, key));
console.log("signatureString");
console.log(signatureString.toString(16));

// console.log("============ server");
// console.log("u"); // TODO: DEBUG
// console.log(U.toString(16)); // TODO: DEBUG
// console.log("x"); // TODO: DEBUG
// console.log(x.toString(16)); // TODO: DEBUG
// console.log("s"); // TODO: DEBUG
// console.log(S.toString(16)); // TODO: DEBUG
// console.log("hkdf"); // TODO: DEBUG
// console.log(hkdf); // TODO: DEBUG
// console.log("signatureString"); // TODO: DEBUG
// console.log(signatureString); // TODO: DEBUG

// console.log(signatureString);
srp.getPasswordSignature(B.toString(16), SECRET, SALT);
console.log("timestamp");
console.log(srp.getTimeStamp());

// Server Proves Both Client and Server K Matches, since they both share matching K
// Carol → Steve: M1 = H[H(N) XOR H(g) | H(I) | s | A | B | KCarol]. Steve verifies M1.
// const sig = srp.getPasswordSignature(B, SECRET, SALT);

// console.log("A");
// console.log(A.toString(16));
// console.log("Ssteve");
// console.log(Ssteve);
// console.log("Ksteve");
// console.log(Ksteve);
