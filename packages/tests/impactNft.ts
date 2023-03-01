import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { ImpactNft } from "../types/impact_nft";
import { expect } from "chai";
import testAuthority from "./fixtures/id.json";
import BN from "bn.js";
import { ImpactNftClient } from "../client";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { getTestMetadata } from "./util";
import { assert } from "chai";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

const program = anchor.workspace.ImpactNft as Program<ImpactNft>;
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

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

  let stateAddress: PublicKey;
  let offsetTiersAddress: PublicKey;

  it("Can register a new global state", async () => {
    const levels = 10;
    client = await ImpactNftClient.register(authority.publicKey, levels);

    expect(client.stateAddress).not.to.be.null;

    stateAddress = client.stateAddress as PublicKey;

    const state = await program.account.globalState.fetch(stateAddress);
    expect(state.authority.toBase58()).equal(authority.publicKey.toBase58());
    expect(state.levels).equal(levels);
  });

  it("Can create offset tiers", async () => {
    const meta = getTestMetadata();

    const level1 = {
      offset: new BN(100),
      uri: meta[0] 
    };
    const level2 = {
      offset: new BN(200),
      uri: meta[1]
    };
    const level3 = {
      offset: new BN(300),
      uri: meta[2]
    };
    const authKey = authority.publicKey;
    const levels = [level1, level2, level3];

    offsetTiersAddress = PublicKey.findProgramAddressSync([
      Buffer.from("offset_tiers"), authority.publicKey.toBuffer()
    ], program.programId)[0];

    await program.methods
    .createOffsetTiers({
      authority: authKey,
      levels: levels
    })
    .accounts({
      authority: authority.publicKey,
      globalState: stateAddress,
      offsetTiers: offsetTiersAddress,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([authority])
    .rpc();

    let tiers = await program.account.offsetTiers.fetch(offsetTiersAddress);

    assert((tiers.levels[0].offset as BN).eq(level1.offset));
    assert((tiers.levels[1].offset as BN).eq(level2.offset));
    assert((tiers.levels[2].offset as BN).eq(level3.offset));

    assert((tiers.levels[0].uri as string) == level1.uri);
    assert((tiers.levels[1].uri as string) == level2.uri);
    assert((tiers.levels[2].uri as string) == level3.uri);
  });

  it("can mint a base nft", async() => {
    let user = Keypair.generate();
    let masterEditionMint = Keypair.generate();

    let userAssociatedTokenAccount = PublicKey.findProgramAddressSync(
      [
        user.publicKey.toBuffer(),
        spl.TOKEN_PROGRAM_ID.toBuffer(),
        masterEditionMint.publicKey.toBuffer(),
      ],
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];

    const metadataAddress =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          masterEditionMint.publicKey.toBuffer()
        ],
        TOKEN_METADATA_PROGRAM_ID)[0];

    const masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync([
      Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), masterEditionMint.publicKey.toBuffer(),
      Buffer.from("edition")], TOKEN_METADATA_PROGRAM_ID)[0];

    const offsetMetadataAddress = anchor.web3.PublicKey.findProgramAddressSync([
      Buffer.from("offset_metadata"), masterEditionMint.publicKey.toBuffer()
    ], program.programId)[0];

    console.log({
      payer: authority.publicKey,
      mintAuthority: authority.publicKey,
      mint: masterEditionMint.publicKey,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      metadata: metadataAddress,
      mintNftToOwner: user.publicKey,
      mintNftTo: userAssociatedTokenAccount,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      masterEdition: masterEditionAddress,
      globalState: stateAddress,
      offsetTiers: offsetTiersAddress,
      offsetMetadata: offsetMetadataAddress,
    });

    try {
    await program.methods
      .mintNft(new BN(50), "sunrise", "sun")
      .accounts({
        payer: authority.publicKey,
        mintAuthority: authority.publicKey,
        mint: masterEditionMint.publicKey,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        metadata: metadataAddress,
        mintNftToOwner: user.publicKey,
        mintNftTo: userAssociatedTokenAccount,
        associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        masterEdition: masterEditionAddress,
        globalState: stateAddress,
        offsetTiers: offsetTiersAddress,
        offsetMetadata: offsetMetadataAddress,
      })
      .signers([masterEditionMint, authority])
      .rpc();
    } catch(err) {
      console.log(err);
    }
  });

  it("can update an nft", async() => {

  });
});
