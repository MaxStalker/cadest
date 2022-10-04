import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";

const ec = new EC("p256");

const hashMsgHex = (msgHex) => {
	const sha = new Bun.SHA384(256);
  sha.update(Buffer.from(msgHex, "hex"));
  const result = sha.digest();
  console.log({ result });
  return result;
};

export const signWithKey = (privateKey, msgHex) => {
  const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
  const sig = key.sign(hashMsgHex(msgHex));
  const n = 32; // half of signature length?
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);
  return Buffer.concat([r, s]).toString("hex");
};
