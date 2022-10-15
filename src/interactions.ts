import { replaceImportAddresses } from "@onflow/flow-cadut";
import { isObject } from "./utils";
import { getCadenceCode } from "./file";
import { AddressMap } from "./types/file";
import { sign } from "crypto";

export const DEFAULT_LIMIT = "999";

type MaybeString = string | null;
type MaybeSigners = string[] | null;

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
  limit: MaybeString;
  proposer: MaybeString;
  payer: MaybeString;
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

    let proposer = "";
    let payer = "";

    return {
      code: ixCode,
      args: ixArgs,
      signers: signers as MaybeSigners,
      limit: limit.toString(),
      proposer,
      payer,
    };
  };
};

export const executeScript =
  (header: string) =>
  async (
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

const getLatestBlockId = async (endpoint: string): Promise<number> => {
  const url = `${endpoint}/v1/blocks?height=final`;
  const [block] = await fetch(url).then((t) => t.json());
  return block.header.id;
};

const getSequenceNumber = async (
  endpoint: string,
  index: number = 0
): Promise<number> => {
  const url = `${endpoint}/v1/accounts/0xf8d6e0586b0a20c7?expand=keys`;
  const account = await fetch(url).then((t) => t.json());
  return account.keys[index].sequence_number;
};

const prepareBody = async (
  props: ExtractorResult,
  endpoint: string
): Promise<any> => {
  const { code, limit, signers } = props;
  const refBlock = await getLatestBlockId(endpoint);
  const sequence_number = await getSequenceNumber(endpoint);
  const payload_signatures = signers
    // todo: if we would allow to pass payer, we need to filter him from payload signatures
    // .filter((address) => address.includes(payer))
    .map((address) => {
      return {
        address,
        key_index: "0",
        signature: btoa("flow".padStart(64, "x")),
      };
    });
  const body = {
    script: btoa(code),
    arguments: [],
    reference_block_id: refBlock,
    gas_limit: limit,
    payer: "f8d6e0586b0a20c7",
    proposal_key: {
      address: "f8d6e0586b0a20c7",
      key_index: "0",
      sequence_number,
    },
    envelope_signatures: [
      {
        address: "f8d6e0586b0a20c7",
        key_index: "0",
        signature: btoa("flow".padStart(64, "x")),
      },
    ],
    payload_signatures,
    authorizers: signers,
  };
  return JSON.stringify(body);
};

export const getTransactionResult = async (id: string, endpoint) => {
  try {
    const url = `${endpoint}/v1/transaction_results/${id}`;
    let result = await fetch(url).then((t) => t.json());
    return result;
  } catch (e) {
    console.error("Tx Result Error:");
    console.log("Tx Id:", id);
    console.log("Message:", e.message);
  }
};

export const sendTransaction =
  (header: string) =>
  async (
    props: ExtractorParams,
    basePath: string,
    endpoint = "http://localhost:8888"
  ) => {
    const params: ExtractorResult = await extractParameters(
      "transaction",
      basePath
    )(props);
    const { args, code } = params;
    const url = `${endpoint}/v1/transactions`;
    try {
      const body = await prepareBody(params, endpoint);
      const response = await fetch(url, {
        method: "POST",
        body,
      }).then((t) => t.json());
      console.log(response);

      const txResult = await getTransactionResult(response.id, endpoint);
      console.log({ txResult });
      return txResult;
    } catch (e) {
      console.log("Something is wrong!");
      console.log(e);
      console.error(e.message);
    }
  };

export const query = executeScript;
export const mutate = sendTransaction;
