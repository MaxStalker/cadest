// use this module to read files
// node:fs and node:path shall help with reading files

import { readFile } from "node:fs";
import { resolve } from "node:path";
import { FileType, MaybeAddressMap } from "./types/file";
import { defaultAddresses } from "./defaults";
import { replaceImportAddresses } from "@onflow/flow-cadut";

export const getCadenceCode =
  (name: String, type: FileType, addressMap: MaybeAddressMap): Function =>
  async (basePath): Promise<String> => {
    const path = resolve(basePath, `${type}s/${name}.cdc`);
    return new Promise((resolve, reject) => {
      readFile(path, "utf-8", (err, code) => {
        if (err) {
          reject(err);
        } else {
          const fullMap = {
            ...defaultAddresses,
            ...addressMap,
          };
          const finalCode = replaceImportAddresses(code, fullMap);
          resolve(finalCode);
        }
      });
    });
  };
