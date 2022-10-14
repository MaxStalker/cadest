import { replaceImportAddresses } from "@onflow/flow-cadut";
import { isObject } from "./utils";
import { getCadenceCode } from "./file";
import { AddressMap } from "./types/file";

export const DEFAULT_LIMIT = 999;

type MaybeString = string | null;
type MaybeSigners = [string] | null;

interface ExtractorParams {
  name: MaybeString;
  code: MaybeString;
  args: any[];
  signers: MaybeSigners;
  limit: number;
}

interface ExtractorResult {
  code: string;
  args: any[];
  signers: MaybeSigners;
  limit: number;
}

export const extractParameters = (ixType, basePath) => {
  return async (params: ExtractorParams): Promise<ExtractorResult> => {
    const {
      name,
      code,
      args = [],
      signers = [],
      limit = DEFAULT_LIMIT,
    } = params;

    if (!name && !code) {
      throw Error("Both `name` and `code` are missing. Provide either of them");
    }

    const defaultAddresses = {};

    let ixCode = code;
    if (name) {
      ixCode = await getCadenceCode(name, ixType, defaultAddresses)(basePath);
    }

    // We can resolve import addresses here
    // Or simple replace all required addresses with service account
    const resolvedAddressMap = {} as { string: string };

    // Replace code import addresses
    ixCode = replaceImportAddresses(ixCode, resolvedAddressMap);

    // TODO: Fix argument mapping
    let ixArgs = args.map((i) => i);

    return {
      code: ixCode,
      args: ixArgs,
      signers: signers as MaybeSigners,
      limit,
    };
  };
};

export const executeScript = async (
  props: ExtractorParams,
  basePath: string,
  endpoint = "http://localhost:8888"
) => {
  const params: ExtractorResult = await extractParameters(
    "script",
    basePath
  )(props);

  const { args, code } = params;
  const url = `${endpoint}/v1/scripts`;
  try {
    const body = JSON.stringify({
      script: btoa(code),
      arguments: args,
    });
    const response = await fetch(url, {
      method: "POST",
      body,
    }).then((t) => t.json());
    const { value } = JSON.parse(atob(response));
    return value;
  } catch (e) {
    // TOOD: Process errors here
    console.error(e.message);
  }
};

export const query = executeScript;
