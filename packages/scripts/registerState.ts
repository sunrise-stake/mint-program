import { ImpactNftClient } from "../client/src";
import { PublicKey } from "@solana/web3.js";

// USAGE
// ANCHOR_WALLET=~/.config/solana/id.json ANCHOR_PROVIDER_URL=https://api.devnet.solana.com yarn ts-node packages/scripts/registerState.ts

const levels = 10;
const mintAuthority = new PublicKey(process.env.MINT_AUTHORITY);

(async () => {
  const client = await ImpactNftClient.register(mintAuthority, levels);
  console.log(client.stateAddress);
})();
