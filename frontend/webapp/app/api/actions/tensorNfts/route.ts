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

  import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';

  async function fetchNftMetadata(mintAddress: string, connection: Connection) {
    const mintPublicKey = new PublicKey(mintAddress);
    
    // Create a Metaplex instance
    const metaplex = Metaplex.make(connection);
    
    // Fetch the NFT metadata
    const nft = await metaplex.nfts().findByMint({ mintAddress: mintPublicKey });
    console.log(nft);

    // Return relevant NFT details
    return {
        name: nft.name,
        image: nft.json?.image, // URI to metadata, use a fetch call if you need more details
        symbol: nft.symbol,
        sellerFeeBasisPoints: nft.json?.seller_fee_basis_points,
    };
}
  

  export const GET = async (req: Request) => {
    const requestUrl = new URL(req.url);
    const nftMintAddress = requestUrl.searchParams.get('mint')!;
    const connection = new Connection(clusterApiUrl('mainnet-beta'));
  
    // Use Metaplex SDK to fetch NFT metadata
    const nftMetadata = await fetchNftMetadata(nftMintAddress, connection);
    
    const payload: ActionGetResponse = {
      title: `${nftMetadata.name}`,
      icon: nftMetadata.image!,
      description: `Current price: ${nftMetadata.sellerFeeBasisPoints} SOL`,
      label: 'NFT',
      links: {
        actions: [
          {
            label: 'Buy',
            href: `/api/actions/nft/buy?mint=${nftMintAddress}`,
            type: 'transaction'
          },
          {
            label: 'Sell',
            href: `/api/actions/nft/sell?mint=${nftMintAddress}`,
            type: 'transaction'
          },
        ],
      },
    };
  
    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  };
  