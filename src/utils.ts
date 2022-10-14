export const isObject = (arg: any) => typeof arg === "object" && arg !== null;
export const isString = (obj: any) =>
  typeof obj === "string" || obj instanceof String;
export const isAddress = (address: string) =>
  /^0x[0-9a-f]{0,16}$/.test(address);
