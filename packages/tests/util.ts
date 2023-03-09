import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";

const KEYPAIR_PATH = process.cwd() + "/packages/tests/fixtures/id.json";

export const createMetaplexInstance = (connection: Connection): Metaplex => {
  const walletString = fs.readFileSync(KEYPAIR_PATH, { encoding: "utf8" });
  const secretKey = Buffer.from(JSON.parse(walletString));
  const keypair = Keypair.fromSecretKey(secretKey);

  return Metaplex.make(connection).use(keypairIdentity(keypair));
};

export const initializeTestCollection = async (
  metaplex: Metaplex,
  uri: string,
  name: string,
  collectionAuthority: PublicKey
): Promise<Keypair> => {
  const mint = Keypair.generate();

  const { nft } = await metaplex.nfts().create({
    uri,
    name,
    sellerFeeBasisPoints: 100,
    useNewMint: mint,
    isCollection: true,
  });

  await metaplex.nfts().update({
    nftOrSft: nft,
    newUpdateAuthority: collectionAuthority,
  });

  return mint;
};

export const getTestMetadata = (): Array<string> => {
  return [
    "https://raw.githubusercontent.com/sunrise-stake/mint-program/active/packages/tests/fixtures/metadata/meta1.json",
    "https://raw.githubusercontent.com/sunrise-stake/mint-program/active/packages/tests/fixtures/metadata/meta2.json",
    "https://raw.githubusercontent.com/sunrise-stake/mint-program/active/packages/tests/fixtures/metadata/meta3.json",
  ];
};
