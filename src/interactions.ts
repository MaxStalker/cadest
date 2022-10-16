import { replaceImportAddresses } from "@onflow/flow-cadut";
import { getCadenceCode } from "./file";

export const DEFAULT_LIMIT = "999";

interface ExtractorParams {
  name?: string;
  code?: string;
  args?: any[];
  signers?: string[];
  limit?: number;
}

interface ExtractorResult {
  code: string;
  args: any[];
  signers: string[];
  limit: string;
  name?: string;
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
    let ixArgs = args.map((i) => btoa(JSON.stringify(i)));

    let proposer = "";
    let payer = "";

    let ixName = name;
    if (ixType === "contract") {
      // resolve name here
    }

    return {
      name: ixName,
      code: ixCode,
      args: ixArgs,
      signers,
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
  params: ExtractorResult,
  endpoint: string
): Promise<any> => {
  const { code, limit, signers, args } = params;
  console.log({ args });
  const refBlock = await getLatestBlockId(endpoint);
  const sequence_number = await getSequenceNumber(endpoint);
  const payload_signatures = signers
    // todo: if we would allow to pass payer, we need to filter him from payload signatures
    // .filter((address) => address.includes(payer))
    .filter((address) => address.includes("f8d6e0586b0a20c7"))
    .map((address) => {
      return {
        address,
        key_index: "0",
        signature: btoa("flow".padStart(64, "x")),
      };
    });
  const body = {
    script: btoa(code),
    arguments: args,
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
    payload_signatures: [],
    authorizers: signers,
  };
  console.log({ body });
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

// Export aliases as well
export const query = executeScript;
export const mutate = sendTransaction;

export const hexContract = (contract) =>
  Buffer.from(contract, "utf8").toString("hex");

export const deployTemplate = () => {
  const code = `
    transaction(name:String, code: String) {
        prepare(acct: AuthAccount){
            let decoded = code.decodeHex()
            acct.contracts.add(
               name: name,
               code: decoded
            )
        }
    }
  `;
  // TODO: allow to pass arguments
  return code;
};

export const deployContract =
  (header: string) =>
  async (
    props: ExtractorParams,
    basePath: string,
    endpoint = "http://localhost:8888"
  ) => {
    const params: ExtractorResult = await extractParameters(
      "contract",
      basePath
    )(props);
    console.log({ params });

    const { code, name } = params;
    // Replace contract import addresses
    const addressMap = {} as { string: string };
    let contractCode = replaceImportAddresses(code, addressMap);
    const hexedCode = hexContract(contractCode);
    const txCode = deployTemplate();
    await sendTransaction(header)(
      {
        code: txCode,
        signers: ["0xf8d6e0586b0a20c7"],
        args: [
          { type: "String", value: name },
          { type: "String", value: hexedCode },
        ],
      },
      basePath
    );
  };
