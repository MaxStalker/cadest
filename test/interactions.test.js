import { it, describe, expect } from "bun:test";
import {
  DEFAULT_LIMIT,
  extractParameters,
  executeScript,
  query,
  sendTransaction,
  mutate,
} from "../src/interactions";

const basePath = `${__dirname}/cadence`;

describe("parameter extractor", () => {
  it("shall extract values from code", async () => {
    const LIMIT = 42;
    const params = await extractParameters(
      "script",
      basePath
    )({
      code: `pub fun main(){ /* nothing to see here */ }`,
      limit: LIMIT,
    });
    const { code, limit } = params;
    expect(code.includes("nothing")).toBe(true);
    expect(limit).toBe(LIMIT);
  });

  it("shall read file and get params", async () => {
    const params = await extractParameters(
      "script",
      basePath
    )({
      name: "basic",
    });

    const { code, limit } = params;
    expect(code.includes("return 42")).toBe(true);
    expect(limit).toBe(DEFAULT_LIMIT);
  });

  it("shall extract transaction", async () => {
    const params = await extractParameters(
      "transaction",
      basePath
    )({
      name: "basic",
      signers: ["Alice"],
    });

    const { code, limit, signers } = params;
    expect(code.includes("signer.Address")).toBe(true);
    expect(limit).toBe(DEFAULT_LIMIT);
    expect(signers.length).toBe(1);
  });
});


describe("script execution", () => {
  // run emulator before running this test
  it("shall properly return value from emulator", async () => {
    const result = await executeScript("test")({ name: "number" }, basePath);
    expect(result).toBe("1337");
  });

  it("shall properly use query alias ", async () => {
    const result = await query("test")({ name: "number" }, basePath);
    expect(result).toBe("1337");
  });
});