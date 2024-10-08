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
  NextActionLink,
} from "@solana/actions";
import {
  clusterApiUrl,
  Authorized,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  TransactionMessage,
  LAMPORTS_PER_SOL,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
//@ts-ignore
import * as multisig from "@sqds/multisig";

let vault_account: PublicKey;
let multisigPda: PublicKey;

export const GET = async (req: Request) => {
  return Response.json({ message: "Method not supported" } as ActionError, {
    status: 403,
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const POST = async (
  req: Request,
  { params }: { params: { vaultId: string } },
) => {
  try {
    const requestUrl = new URL(req.url);
    const {
      action,
      amount,
      txnIndexForChecking,
      wallet,
      memberAddress,
      newThreshold,
      txIndex,
      multisigAddress,
    } = validatedQueryParams(requestUrl);

    const body: ActionPostRequest = await req.json();
    let payerAccount: PublicKey;
    try {
      payerAccount = new PublicKey(body.account);
    } catch (err) {
      throw 'Invalid "account" provided';
    }

    const multisg = params.vaultId;
    multisigPda = new PublicKey(multisg);
    console.log(multisigPda);

    [vault_account] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    });

    const baseHref = new URL(
      `/api/actions/squad/${multisg}`,
      requestUrl.origin,
    ).toString();
    console.log("BASE HREF: ", baseHref);

    const connection = new Connection(clusterApiUrl("mainnet-beta"));

    let transaction = new Transaction();
    const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      multisigPda,
    );
    const txnIndex = multisigInfo.transactionIndex;
    const newTxnIndex = Number(txnIndex) + 1;

    let finalTxnIndex;
    if (txnIndexForChecking && txnIndexForChecking != 0) {
      finalTxnIndex = txnIndexForChecking;
    } else {
      finalTxnIndex = Number(multisigInfo.transactionIndex) + 1;
    }

    const [proposalPda] = multisig.getProposalPda({
      multisigPda,
      transactionIndex: BigInt(txIndex),
    });
    let proposalInfo;
    try {
      proposalInfo = await multisig.accounts.Proposal.fromAccountAddress(
        connection,
        proposalPda,
      );
    } catch (error) {
      proposalInfo = null;
    }

    if (action == "send") {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: vault_account,
        toPubkey: new PublicKey(wallet),
        lamports: amount * LAMPORTS_PER_SOL,
      });
      const transferMessage = new TransactionMessage({
        payerKey: vault_account,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        instructions: [transferInstruction],
      });
      const IX1 = multisig.instructions.vaultTransactionCreate({
        multisigPda,
        transactionIndex: BigInt(Number(txnIndex) + 1),
        creator: payerAccount,
        vaultIndex: 0,
        ephemeralSigners: 0,
        transactionMessage: transferMessage,
      });
      transaction.add(IX1);
    }

    if (action == "deposit") {
      const ixn = SystemProgram.transfer({
        fromPubkey: payerAccount,
        toPubkey: vault_account,
        lamports: amount * LAMPORTS_PER_SOL,
      });
      transaction.add(ixn);
    }

    if (action == "goToTxnIndex") {
      console.log(`GOING TO TXN INDEX #${txnIndexForChecking}`);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payerAccount,
          toPubkey: payerAccount,
          lamports: 0,
        }),
      );
    }

    if (action == "add") {
      transaction.add(
        multisig.instructions.configTransactionCreate({
          multisigPda,
          transactionIndex: BigInt(Number(txnIndex) + 1),
          creator: payerAccount,
          actions: [
            {
              __kind: "AddMember",
              newMember: {
                key: new PublicKey(memberAddress),
                permissions: multisig.types.Permissions.all(),
              },
            },
          ],
        }),
      );
    }
    if (action == "remove") {
      transaction.add(
        multisig.instructions.configTransactionCreate({
          multisigPda,
          transactionIndex: BigInt(Number(txnIndex) + 1),
          creator: payerAccount,
          actions: [
            {
              __kind: "RemoveMember",
              oldMember: new PublicKey(memberAddress),
            },
          ],
        }),
      );
    }
    if (action == "change") {
      transaction.add(
        multisig.instructions.configTransactionCreate({
          multisigPda,
          transactionIndex: BigInt(Number(txnIndex) + 1),
          creator: payerAccount,
          actions: [
            {
              __kind: "ChangeThreshold",
              newThreshold: newThreshold,
            },
          ],
        }),
      );
    }
    if (action == "approve") {
      if (proposalInfo?.status.__kind == "Active") {
        const instruction = multisig.instructions.proposalApprove({
          multisigPda,
          transactionIndex: BigInt(Number(txIndex)),
          member: payerAccount,
          programId: multisig.PROGRAM_ID,
        });
        transaction.add(instruction);
      } else {
        const instructionProposalCreate = multisig.instructions.proposalCreate({
          multisigPda,
          creator: payerAccount,
          rentPayer: payerAccount,
          transactionIndex: BigInt(Number(txIndex)),
        });
        const instruction = multisig.instructions.proposalApprove({
          multisigPda,
          transactionIndex: BigInt(Number(txIndex)),
          member: payerAccount,
        });
        transaction.add(instructionProposalCreate).add(instruction);
      }
      console.log("somethiung");
    }
    if (action == "execute") {
      console.log("ahhaahah");
      const instruction = (
        await multisig.instructions.vaultTransactionExecute({
          connection,
          multisigPda,
          transactionIndex: BigInt(Number(txIndex)),
          member: payerAccount,
        })
      ).instruction;
      transaction.add(instruction);
    }
    if (action == "reject") {
      if (proposalInfo?.status.__kind == "Active") {
        const instruction = multisig.instructions.proposalReject({
          multisigPda,
          transactionIndex: BigInt(Number(txIndex)),
          member: payerAccount,
        });
        transaction.add(instruction);
      } else {
        const instructionProposalCreate = multisig.instructions.proposalCreate({
          multisigPda,
          creator: payerAccount,
          rentPayer: payerAccount,
          transactionIndex: BigInt(Number(txIndex)),
        });
        const instruction = multisig.instructions.proposalReject({
          multisigPda,
          transactionIndex: BigInt(Number(txIndex)),
          member: payerAccount,
        });
        transaction.add(instructionProposalCreate).add(instruction);
      }
      console.log("some");
    }

    transaction.feePayer = payerAccount;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    let payload: ActionPostResponse = await createPostResponse({
      //@ts-ignore
      fields: {
        transaction,
        message: `${
          action === "approve"
            ? "Vote Approved"
            : action === "reject"
              ? "Rejected"
              : action == "approveandexecute"
                ? "Approved and Executed"
                : `Vault Transaction ${txIndex} Finally Executed!`
        }`,
        ...(action == "approve" || action == "reject" || action == "execute"
          ? {}
          : {
              links: {
                next: getVoteAction(action!, txIndex, multisg, requestUrl),
              },
            }),
      },
    });

    function getVoteAction(
      action: string,
      txIndex: number,
      multisg: string,
      requestUrl: URL,
    ): NextActionLink {
      const latestTxIndex = multisigInfo.transactionIndex;
      console.log("multisig address: ", multisg);
      let description = "",
        label = "Successful";
      if (action == "add") {
        description = `voting for Transaction #${newTxnIndex}`;
        label = "Voting Successful";
      }
      if (action == "execute") {
        description = `Successfully executed Vault Transaction #${txIndex}`;
        label = "Executed";
      }
      if (action == "reject") {
        description = `Rejected Transaction #${txIndex}`;
        label = "Rejected";
      }
      if (action == "approveandexecute") {
        description = `Successfully Approved and Executed Vault Transaction #${txIndex}`;
        label = "Approved and Executed";
      }

      const baseHref = new URL(
        `/api/actions/squad/${multisg}`,
        requestUrl.origin,
      ).toString();
      return {
        type: "inline",
        action: {
          description: description,
          icon: "https://ucarecdn.com/914284ad-6250-43a4-89dc-20e3d5a78c6e/-/preview/1000x1000/",
          label: label,
          title: `Action Complete!`,
          type: "action",
          links: {
            actions: [
              {
                label: "Approve",
                href: `${baseHref}?action=approve&multisigAddress=${multisg}&txIndex=${newTxnIndex}`,
                type: "transaction",
              },
              {
                label: "Reject",
                href: `${baseHref}?action=reject&multisigAddress=${multisg}&txIndex=${newTxnIndex} `,
                type: "transaction",
              },
              {
                label: "Execute",
                href: `${baseHref}?action=execute&multisigAddress=${multisg}&txIndex=${newTxnIndex}`,
                type: "transaction",
              },
            ],
          },
        },
      };
    }

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(JSON.stringify(message), {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};

export const OPTIONS = async (req: Request) => {
  return new Response(null, {
    status: 204,
    headers: ACTIONS_CORS_HEADERS,
  });
};

function validatedQueryParams(requestUrl: URL) {
  let action;
  let amount = 0.001;
  let multisigAddress = "";
  let txnIndexForChecking = 0;
  let txIndex = 0;
  let wallet = "";
  let memberAddress = "";
  let newThreshold = 0;

  if (requestUrl.searchParams.get("multisigAddress")) {
    multisigAddress = requestUrl.searchParams.get("multisigAddress")!;
  }
  if (requestUrl.searchParams.get("txIndex")) {
    txIndex = parseInt(requestUrl.searchParams.get("txIndex")!);
  }
  if (requestUrl.searchParams.get("newThreshold")) {
    newThreshold = parseInt(requestUrl.searchParams.get("newThreshold")!);
  }
  if (requestUrl.searchParams.get("memberAddress")) {
    memberAddress = requestUrl.searchParams.get("memberAddress")!;
  }
  try {
    if (requestUrl.searchParams.get("action")) {
      action = requestUrl.searchParams.get("action")!;
    }
  } catch (err) {
    throw "Invalid input query parameters";
  }
  try {
    if (requestUrl.searchParams.get("amount")) {
      amount = parseFloat(requestUrl.searchParams.get("amount")!);
    }
  } catch (err) {
    throw "Invalid input query parameters";
  }
  if (requestUrl.searchParams.get("txnIndex")) {
    txnIndexForChecking = parseInt(requestUrl.searchParams.get("txnIndex")!);
  }
  if (requestUrl.searchParams.get("wallet")) {
    wallet =
      requestUrl.searchParams.get("wallet") ||
      "46Cx8SHg8jojWgG6QdytHZK8Fr2eheK6YqZDaSy49q4V";
  }
  return {
    action,
    amount,
    txnIndexForChecking,
    wallet,
    memberAddress,
    newThreshold,
    txIndex,
    multisigAddress,
  };
}
