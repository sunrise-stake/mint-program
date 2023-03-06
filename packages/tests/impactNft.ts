import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { ImpactNft } from "../client/src/types/impact_nft";
import { expect } from "chai";
import BN from "bn.js";
import { ImpactNftClient, confirm } from "../client/src";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { assert } from "chai";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Level } from "../client/src";
import {
  createMetaplexInstance,
  initializeTestCollection,
  getTestMetadata,
} from "./util";

const program = anchor.workspace.ImpactNft as Program<ImpactNft>;

// This would typically be a PDA onwed by a different program
// e.g. the sunrise program
const mintAuthority = Keypair.generate();

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
  let user = Keypair.generate();

  before(async () => {
    // fund the mint authority
    await program.provider.connection
      .requestAirdrop(mintAuthority.publicKey, 100 * LAMPORTS_PER_SOL)
      .then(async (sig) => program.provider.connection.confirmTransaction(sig));
  });

  let stateAddress: PublicKey;

  const initialOffset = new BN(140); // should still default to a level0 nft
  const updateOffset = new BN(220); // should upgrade to a level1 nft

  const mint = Keypair.generate();

  let levels: Array<Level>;

  it("Can register a new global state", async () => {
    const levels = 10;
    client = await ImpactNftClient.register(mintAuthority.publicKey, levels);

    expect(client.stateAddress).not.to.be.null;

    stateAddress = client.stateAddress as PublicKey;

    const state = await program.account.globalState.fetch(stateAddress);
    expect(state.mintAuthority.toBase58()).equal(
      mintAuthority.publicKey.toBase58()
    );
    expect(state.adminAuthority.toBase58()).equal(
      client.provider.publicKey.toBase58()
    );
    expect(state.levels).equal(levels);
  });

  it("Can create offset tiers", async () => {
    const metadata = getTestMetadata();
    const metaplex = createMetaplexInstance(client.provider.connection);

    const mint1 = await initializeTestCollection(
      metaplex,
      metadata[0],
      "sunriseStake0Collection",
      mintAuthority.publicKey
    );
    const mint2 = await initializeTestCollection(
      metaplex,
      metadata[1],
      "sunriseStake1Collection",
      mintAuthority.publicKey
    );
    const mint3 = await initializeTestCollection(
      metaplex,
      metadata[2],
      "sunriseStake2Collection",
      mintAuthority.publicKey
    );

    const level1: Level = {
      offset: new BN(100), // tier 0 limit
      uri: metadata[0],
      name: "sunriseStake0",
      symbol: "sun0",
      collectionMint: mint1.publicKey,
    };
    const level2 = {
      offset: new BN(200), // tier 1 limit
      uri: metadata[1],
      name: "sunriseStake1",
      symbol: "sun1",
      collectionMint: mint2.publicKey,
    };
    const level3 = {
      offset: new BN(300), // tier 2 limit
      uri: metadata[2],
      name: "sunriseStake2",
      symbol: "sun2",
      collectionMint: mint3.publicKey,
    };

    levels = [level1, level2, level3];
    await client.registerOffsetTiers(levels);

    const offsetTiersAddress = client.getOffsetTiersAddress(
      client.stateAddress
    );

    let tiers = await program.account.offsetTiers.fetch(offsetTiersAddress);

    assert((tiers.levels[0].offset as BN).eq(level1.offset));
    assert((tiers.levels[1].offset as BN).eq(level2.offset));
    assert((tiers.levels[2].offset as BN).eq(level3.offset));

    assert((tiers.levels[0].uri as string) == level1.uri);
    assert((tiers.levels[1].uri as string) == level2.uri);
    assert((tiers.levels[2].uri as string) == level3.uri);
  });

  it("can mint an nft and update its offset", async () => {
    const mintNftAccounts = client.getMintNftAccounts(
      mint.publicKey,
      user.publicKey
    );

    console.log("mint", mint.publicKey.toBase58());
    console.log("user", user.publicKey.toBase58());
    console.log("mintAuthority", mintAuthority.publicKey.toBase58());

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

    const collectionMint = levels[0].collectionMint;
    const collectionMetadata = client.getMetadataAddress(collectionMint);
    const collectionMasterEdition =
      client.getMasterEditionAddress(collectionMint);

    const accounts = {
      ...mintNftAccounts,
      collectionMint,
      collectionMetadata,
      collectionMasterEdition,
      payer: client.provider.publicKey,
      mint: mint.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      mintNftToOwner: user.publicKey,
      mintNftTo: mintNftAccounts.userTokenAccount,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      globalState: client.stateAddress,
    };

    try {
      await client.program.methods
        .mintNft(initialOffset)
        .accounts(accounts)
        .signers([mint, mintAuthority])
        .preInstructions([modifyComputeUnits])
        .rpc()
        .then(() => confirm(client.provider.connection));
    } catch (err) {
      console.log(err);
    }

    const value = await program.provider.connection
      .getTokenAccountBalance(mintNftAccounts.userTokenAccount)
      .then((res) => res.value);
    assert(Number(value.amount) == 1);

    const offsetMetadataAccount = await program.account.offsetMetadata.fetch(
      mintNftAccounts.offsetMetadata
    );
    assert(offsetMetadataAccount.offset.eq(initialOffset));
  });

  it("can update an nft", async () => {
    const accounts = client.getMintNftAccounts(mint.publicKey, user.publicKey);
    const updateAccounts = await client.getUpdateNftAccounts(
      mint.publicKey,
      updateOffset
    );

    try {
      await program.methods
        .updateNft(updateOffset)
        .accounts({
          ...accounts,
          ...updateAccounts,
          tokenAccount: accounts.userTokenAccount,
          globalState: client.stateAddress,
          mint: mint.publicKey,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
        })
        .signers([mintAuthority])
        .rpc();
    } catch (err) {
      console.log(err);
    }

    let offsetMetadata = await program.account.offsetMetadata.fetch(
      accounts.offsetMetadata
    );
    assert(offsetMetadata.offset.eq(updateOffset));

    // TODO: Find a way to validate that the mpl metadata is indeed updated
  });
});
