import { getCadenceCode } from "./file";

const code = ``;
const addressMap = {
  FT: "0x1337",
};
const result = await getCadenceCode("basic", "script", addressMap)("./test/cadence");
console.log({ result });
