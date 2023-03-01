import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ImpactNft } from "../types/impact_nft";
import { expect } from "chai";
import testAuthority from "./fixtures/id.json";
import BN from "bn.js";
import { ImpactNftClient } from "../client";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const program = anchor.workspace.ImpactNft as Program<ImpactNft>;

export const expectAmount = (
  actualAmount: number | BN,
  expectedAmount: number | BN,
  tolerance = 0
) => {
  const actualAmountBN = new BN(actualAmount);
  const minExpected = new BN(expectedAmount).subn(tolerance);
  const maxExpected = new BN(expectedAmount).addn(tolerance);

  console.log(
    "Expecting",
    actualAmountBN.toString(),
    "to be at least",
    new BN(minExpected).toString(),
    "and at most",
    new BN(maxExpected).toString()
  );

  expect(actualAmountBN.gte(minExpected)).to.be.true;
  expect(actualAmountBN.lte(maxExpected)).to.be.true;
};

describe("impact-nft", () => {
  let client: ImpactNftClient;
  const authority = Keypair.fromSecretKey(Uint8Array.from(testAuthority));

  beforeEach(async () => {
    await program.provider.connection
      .requestAirdrop(authority.publicKey, 100 * LAMPORTS_PER_SOL)
      .then(async (sig) => program.provider.connection.confirmTransaction(sig));
  });

  it("Can register a new global state", async () => {
    const levels = 10;
    client = await ImpactNftClient.register(authority.publicKey, levels);

    expect(client.stateAddress).not.to.be.null;

    const stateAddress = client.stateAddress as PublicKey;

    const state = await program.account.globalState.fetch(stateAddress);
    expect(state.authority.toBase58()).equal(authority.publicKey.toBase58());
    expect(state.levels).equal(levels);
  });
});
