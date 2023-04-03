import { ImpactNftClient, setUpAnchor } from "../client/src";
import { PublicKey } from "@solana/web3.js";

// USAGE
// ANCHOR_WALLET=~/.config/solana/id.json ANCHOR_PROVIDER_URL=https://api.devnet.solana.com yarn ts-node packages/scripts/getState.ts <state-address>

const stateAddress = new PublicKey(process.argv[2]);

(async () => {
  console.log("Getting impact nft state...");
  const client = await ImpactNftClient.get(setUpAnchor(), stateAddress);

  console.log(client.config);
  const details = client.details();

  const report = {
    state: details.state,
    levels: details.levels.map((level) => ({
      ...level,
      offset: level.offset.toString(),
    }))
  };

  console.log(JSON.stringify(report, null, 2));
})();
