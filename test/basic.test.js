import { it, describe, expect } from "bun:test";

async function executeScript(a) {
  const script = btoa(
    `
        pub fun main(a: Int): Int{
          log(a)
          return a + 2000
        }
      `
  );
  const args = [
    btoa(
      JSON.stringify({
        type: "Int",
        value: a.toString(),
      })
    ),
  ];

  const response = await fetch("http://localhost:8888/v1/scripts", {
    method: "POST",
    body: JSON.stringify({
      script,
      arguments: args,
    }),
  }).then((t) => t.json());
  const { value } = JSON.parse(atob(response));
  return parseInt(value);
}

/*
describe("how thus works", () => {
  it("shall do something", async () => {
    for (let i = 0; i < 100; i++) {
      const value = await executeScript(i);
      expect(value).toBe(2000 + i);
    }
  });
});
*/