import { expect, it, describe } from "bun:test";
import { deployContract, query, mutate } from "../src/interactions";

const basePath = `${__dirname}/cadence`;

describe("contract deployment", () => {
  it("shall deploy contract", async () => {
    /*
    await deployContract("test")(
      {
        name: "Basic",
      },
      basePath
    );
    
    */

    const result = await query("test")({
      code: `
        import Basic from 0xf8d6e0586b0a20c7
        
        pub fun main(): Int{
          return Basic.nonce
        }
      `,
    });
    console.log({ result });

    const txResult = await mutate("test")({
      code: `
        import Basic from 0xf8d6e0586b0a20c7
        
        transaction{
          prepare(signer: AuthAccount){
            Basic.setNonce(newNonce: 42)
          }
        }
      `,
      signers: ["0xf8d6e0586b0a20c7"],
    });

    const newResult = await query("test")({
      code: `
        import Basic from 0xf8d6e0586b0a20c7
        
        pub fun main(): Int{
          return Basic.nonce
        }
      `,
    });
    console.log({ newResult });
  });
});
