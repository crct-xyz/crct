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
} from '@solana/actions';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SystemInstruction,
} from '@solana/web3.js';
//@ts-ignore
import * as multisig from '@sqds/multisig';
import { NextActionLink } from '@solana/actions-spec';
import { decodeInstruction } from '@solana/spl-token';


async function validatedQueryParams(requestUrl: URL) {
  let multisigAddress = '';
  let transactionNumber = 0;
  let action: String | null = requestUrl.searchParams.get('action');
  if (requestUrl.searchParams.get('multisigAddress')) {
    multisigAddress = requestUrl.searchParams.get('multisigAddress')!;
  }
  if (requestUrl.searchParams.get('txIndex')) {
    transactionNumber = parseInt(
      requestUrl.searchParams.get('txIndex')!
    );
  }
  return { multisigAddress, transactionNumber, action };
}

export const GET = async (req: Request) => {
  return Response.json({ message: 'Method not supported' } as ActionError, {
    status: 403,
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const POST = async (req: Request) => {
  const requestUrl = new URL(req.url);
  const body: ActionPostRequest = await req.json();
  const account: PublicKey = new PublicKey(body.account);
  const { multisigAddress, transactionNumber, action } = await validatedQueryParams(
    requestUrl
  );

  const connection = new Connection(clusterApiUrl('mainnet-beta'));

  let multisigPda = new PublicKey(multisigAddress);
  let [vault_account] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  });
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda
  );
  const multisigInfo = await fetch(
    `https://v4-api.squads.so/multisig/${vault_account.toString()}`
  ).then((res) => res.json());
  const metadata = multisigInfo.metadata;

  const [transactionPda] = multisig.getTransactionPda({
    multisigPda,
    index: BigInt(transactionNumber),
  });
  const transactionDetails =
    await multisig.accounts.VaultTransaction.fromAccountAddress(
      connection,
      transactionPda
    );
  const [proposalPda] = multisig.getProposalPda({
    multisigPda,
    transactionIndex: BigInt(transactionNumber),
  });
  const proposalInfo = await multisig.accounts.Proposal.fromAccountAddress(
    connection,
    proposalPda
  );
}
