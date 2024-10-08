import {
  createActionHeaders,
  NextActionPostRequest,
  ActionError,
  CompletedAction,
  ACTIONS_CORS_HEADERS,
  ActionGetRequest,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SystemInstruction,
} from "@solana/web3.js";
//@ts-ignore
import * as multisig from "@sqds/multisig";
import { NextActionLink } from "@solana/actions-spec";
import { decodeInstruction } from "@solana/spl-token";

async function validatedQueryParams(requestUrl: URL) {
  let multisigAddress = "";
  let transactionNumber = 0;
  let action: String | null = requestUrl.searchParams.get("action");
  if (requestUrl.searchParams.get("address")) {
    multisigAddress = requestUrl.searchParams.get("address")!;
  }
  if (requestUrl.searchParams.get("transactionNumber")) {
    transactionNumber = parseInt(
      requestUrl.searchParams.get("transactionNumber")!,
    );
  }
  return { multisigAddress, transactionNumber };
}

export const GET = async (req: Request) => {
  const requestUrl = new URL(req.url);
  const { multisigAddress } = await validatedQueryParams(requestUrl);
  const connection = new Connection(clusterApiUrl("mainnet-beta"));

  let multisigPda = new PublicKey(multisigAddress);
  let [vault_account] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  });
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda,
  );
  const multisigInfo = await fetch(
    `https://v4-api.squads.so/multisig/${vault_account.toString()}`,
  ).then((res) => res.json());
  const metadata = multisigInfo.metadata;

  const payload: ActionGetResponse = {
    title: `${metadata.name}`,
    icon: "https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/",
    description: `Enter a transaction number for which you want to cast your vote
    Latest transaction: ${multisigAccount.transactionIndex}`,
    label: "squads",
    links: {
      actions: [
        {
          label: "Vote",
          href: `/api/actions/squad/vote?address=${multisigAddress}&transactionNumber={transactionNumber}`,
          parameters: [
            {
              label: "enter transaction number",
              name: "transactionNumber",
              required: true,
            },
          ],
          type: "transaction",
        },
      ],
    },
  };

  return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  const requestUrl = new URL(req.url);
  const body: ActionPostRequest = await req.json();
  const account: PublicKey = new PublicKey(body.account);
  const { multisigAddress, transactionNumber } =
    await validatedQueryParams(requestUrl);
  const connection = new Connection(clusterApiUrl("mainnet-beta"));

  let multisigPda = new PublicKey(multisigAddress);
  let [vault_account] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  });
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda,
  );
  const multisigInfo = await fetch(
    `https://v4-api.squads.so/multisig/${vault_account.toString()}`,
  ).then((res) => res.json());
  const metadata = multisigInfo.metadata;

  const [transactionPda] = multisig.getTransactionPda({
    multisigPda,
    index: BigInt(transactionNumber),
  });
  const transactionDetails =
    await multisig.accounts.VaultTransaction.fromAccountAddress(
      connection,
      transactionPda,
    );
  const [proposalPda] = multisig.getProposalPda({
    multisigPda,
    transactionIndex: BigInt(transactionNumber),
  });
  const proposalInfo = await multisig.accounts.Proposal.fromAccountAddress(
    connection,
    proposalPda,
  );

  const creator = transactionDetails.creator;
  const baseHref = new URL(
    `/api/actions/squad/${multisigAddress}`,
    requestUrl.origin,
  ).toString();

  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: account,
      lamports: 0,
    }),
  );
  transaction.feePayer = account;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  const payload: ActionPostResponse = await createPostResponse({
    fields: {
      transaction,
      message: "",
      links: {
        next: {
          //@ts-ignore
          type: "inline",
          action: {
            title: `${metadata.name}`,
            description: `Transaction ${transactionNumber}\nCreator: ${creator}}`,
            label: "squads",
            icon: "https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/",
            type: "action",
            links: {
              actions: [
                {
                  label: "Approve",
                  href: `${baseHref}?action=approve&multisigAddress=${multisigAddress}&txIndex=${transactionNumber}`,
                },
                {
                  label: "Reject",
                  href: `${baseHref}?action=reject&multisigAddress=${multisigAddress}&txIndex=${transactionNumber}`,
                },
                {
                  label: "Execute",
                  href: `${baseHref}?action=execute&multisigAddress=${multisigAddress}&txIndex=${transactionNumber}`,
                },
              ],
            },
          },
        },
      },
    },
  });
  console.log("transaction number: ", transactionNumber);
  return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
};
