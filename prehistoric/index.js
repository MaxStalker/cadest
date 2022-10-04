import { encodeTransactionEnvelope, encodeTransactionPayload } from "./encode";
import config from "./flow.json";
import { signWithKey } from "./signers";

const bible = "https://bible-api.com/john%203:16";
const hash = `e42f5bc2a38464c6aefd72559686946ab40a9ae7d19db2513c0a020ee4dd83f3`;
const mainnet = `https://rest-mainnet.onflow.org`;
const endpoint = "http://localhost:8888";
const tx = `${endpoint}/v1/transactions/${hash}`;
const blockchain = `${endpoint}/v1/accounts/0xf8d6e0586b0a20c7`;

/*
const base64 = (value) => new Buffer(value).toString("base64");

const check = "eyJ0eXBlIjoiSW50IiwidmFsdWUiOiIxMzM3In0=";
const ass = base64(
  JSON.stringify({
    type: "Int",
    value: "123",
  })
);
console.log({ ass, check });



const correct = "eyJ0eXBlIjoiSW50IiwidmFsdWUiOiIxMzM3In0=";
*/
async function execScript() {
  const script = btoa(
    `
        pub fun main(a: Int): Int{
          log(a)
          return a + 120
        }
      `
  );
  const args = [
    btoa(
      JSON.stringify({
        type: "Int",
        value: "1880",
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
  console.log(response);
  const { value } = JSON.parse(atob(response));

  console.log({ value });
}

async function submitTransaction() {
  const { address, key } = config.accounts["emulator-account"];
  const [block] = await fetch(
    "http://localhost:8888/v1/blocks?height=final"
  ).then((t) => t.json());
  const { id } = block.header;

  const account = await fetch(
    "http://localhost:8888/v1/accounts/0xf8d6e0586b0a20c7?expand=keys"
  ).then((t) => t.json());
  console.log(account);

  const cadence = `
        transaction{
          prepare(signer: AuthAccount){
            log("it's sorta working")
          }
        }
      `;

  const limit = 999;
  const sequenceNum = account.keys[0].sequence_number;
  console.log({ sequenceNum });
  const args = [];
  const baseTx = {
    cadence,
    arguments: args,
    refBlock: id,
    computeLimit: limit,
    proposalKey: {
      address,
      keyId: 0,
      sequenceNum: parseInt(sequenceNum),
    },
    payer: address,
    authorizers: [address],
  };

  const payloadMessage = encodeTransactionPayload(baseTx);
  console.log({ payloadMessage });
  const payloadSignature = signWithKey(key, payloadMessage);
  const envelopeMessage = encodeTransactionEnvelope({
    ...baseTx,
    payloadSigs: [
      {
        address,
        keyId: 0,
        sig: payloadSignature,
      },
    ],
  });
  const envelopeSignature = signWithKey(key, envelopeMessage);

  const response = await fetch("http://localhost:8888/v1/transactions", {
    method: "POST",
    body: JSON.stringify({
      script: btoa(cadence),
      arguments: [],
      reference_block_id: id,
      gas_limit: "500",
      payer: "f8d6e0586b0a20c7",
      proposal_key: {
        address: "f8d6e0586b0a20c7",
        key_index: "0",
        sequence_number: sequenceNum,
      },
      envelope_signatures: [
        {
          address: "f8d6e0586b0a20c7",
          key_index: "0",
          signature: btoa("flow".padStart(64,"x")),
        },
      ],
    }),
  }).then((t) => t.json());
  console.log(response);
}

await submitTransaction();
