import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ImpactNft } from "../target/types/impact_nft";

describe("impact-nft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ImpactNft as Program<ImpactNft>;

  it("Is initialized!", async () => {
    // TODO TEMP
    const state = {
      authority: anchor.web3.Keypair.generate().publicKey,
      levels: 10,
      bump: 0,
    };
    const tx = await program.methods.createGlobalState(state).rpc();
    console.log("Your transaction signature", tx);
  });
});
