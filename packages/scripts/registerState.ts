import { ImpactNftClient } from "../client/src";
import { PublicKey } from "@solana/web3.js";
import {getTestMetadata} from "../tests/util";
import BN from "bn.js";

// USAGE
// ANCHOR_WALLET=~/.config/solana/id.json ANCHOR_PROVIDER_URL=https://api.devnet.solana.com yarn ts-node packages/scripts/registerState.ts <mint-authority>

const mintAuthority = new PublicKey(process.argv[2]);

(async () => {
  const meta = getTestMetadata();

  console.log("Registering impact nft state...")
  const client = await ImpactNftClient.register(mintAuthority, meta.length);

  const levels = meta.map((uri, i) => ({
    offset: new BN(i * 100),
    uri,
    name: `Sunrise Stake Impact Level ${i}`,
    symbol: `SUNRISE${i}`,
  }));

  console.log("Registering offset tiers...")
  await client.registerOffsetTiers(levels)
  console.log("Done! State address: " + client.stateAddress)
})();
