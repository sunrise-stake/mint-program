import {ImpactNftClient, setUpAnchor} from "../client/src";
import { PublicKey } from "@solana/web3.js";
import meta from "./impactNFTLevels.json";
import BN from "bn.js";

// USAGE
// ANCHOR_WALLET=~/.config/solana/id.json ANCHOR_PROVIDER_URL=https://api.devnet.solana.com yarn ts-node packages/scripts/registerState.ts <mint-authority>


const mintAuthority = new PublicKey(process.argv[2]);
const stateAddress = process.argv.length > 3 ? new PublicKey(process.argv[3]) : undefined;

(async () => {
    let client: ImpactNftClient;
    if (stateAddress) {
        console.log("Using existing state address: " + stateAddress);
        client = await ImpactNftClient.get(setUpAnchor(), stateAddress);
    } else {
        console.log("Registering impact nft state...");
        client = await ImpactNftClient.register(mintAuthority, meta.length);
    }

    console.log("State address: " + client.stateAddress);

    console.log("Creating collection mints...");
    const levels = await Promise.all(
        meta.map(async ({ uri, name, symbol, offset }, i) => {
            console.log(`Creating collection for level ${i}...`);
            const mint = await client.createCollectionMint(
                uri,
                `Sunrise Impact Collection ${i}`
            );
            return {
                offset: new BN(offset),
                uri,
                name,
                symbol,
                collectionMint: mint.publicKey,
            };
        })
    );

    console.log("Registering offset tiers 0-3 ...");
    await client.registerOffsetTiers(levels.slice(0, 4));

    console.log("Registering offset tiers 4-7...");
    await client.addLevelsToOffsetTiers(levels.slice(4, 8));

    console.log("Registering offset tiers 8-9...");
    await client.addLevelsToOffsetTiers(levels.slice(9));
    console.log("Done! State address: " + client.stateAddress);
})();
