import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Temp } from "../target/types/temp";

describe("temp", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Temp as Program<Temp>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
