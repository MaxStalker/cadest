// use this module to read files
// node:fs and node:path shall help with reading files

import { readFile } from "node:fs";
import { resolve } from "node:path";

type FileType = "script" | "transaction" | "contract";

export const getCadenceCode =
  (name: String, type: FileType): Function =>
  async (basePath): Promise<String> => {
    const path = resolve(basePath, `cadence/${type}s/${name}.cdc`);
    return new Promise((resolve, reject) => {
      readFile(path, "utf-8", (err, code) => {
        resolve(code);
      });
    });
  };
