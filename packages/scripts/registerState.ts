import { ImpactNftClient } from "../client/src";

// USAGE
// ANCHOR_WALLET=~/.config/solana/id.json ANCHOR_PROVIDER_URL=https://api.devnet.solana.com yarn ts-node packages/scripts/registerState.ts

const levels = 10;

(async () => {
  const client = await ImpactNftClient.register(levels);
  console.log(client.stateAddress);
})();
