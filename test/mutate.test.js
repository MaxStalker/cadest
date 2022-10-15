import { describe, it, expect } from "bun:test";
import { sendTransaction } from "../src/interactions";

const basePath = `${__dirname}/cadence`;

describe("send transaction", () => {
  it("shall properly send transaction", async () => {
    const result = await sendTransaction("test")(
      {
        name: "basic",
        signers: ["0x01cf0e2f2f715450"],
      },
      basePath
    );
    console.log({ result });
  });
});
