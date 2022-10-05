import { it, describe, expect } from "bun:test";
import { getCadenceCode } from "../src/file";

describe("read files", () => {
  it("shall get basic script", async () => {
    const fileContents = await getCadenceCode("basic", "script")(__dirname);
    const code = `// this is basic script
      pub fun main(): Int { return 42 }`;
    expect(fileContents).toBe(code);
  });
});
