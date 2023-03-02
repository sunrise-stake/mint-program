import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { ImpactNft } from "../types/impact_nft";
import { expect } from "chai";
import testAuthority from "./fixtures/id.json";
import BN from "bn.js";
import { ImpactNftClient, confirm } from "../client";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { getTestMetadata } from "./util";
import { assert } from "chai";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const program = anchor.workspace.ImpactNft as Program<ImpactNft>;
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

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
  let masterEditionMint: Keypair;
  let metadataAddress: PublicKey;
  let masterEditionAddress: PublicKey;
  let offsetMetadataAddress: PublicKey;
  let userAssociatedTokenAccount: PublicKey;

  const initialOffset = new BN(140); // should still default to a level0 nft
  const updatedOffset = new BN(180); // should upgrade to a level1 nft

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
      offset: new BN(100), // tier 0 limit
      uri: meta[0],
    };
    const level2 = {
      offset: new BN(200), // tier 1 limit
      uri: meta[1],
    };
    const level3 = {
      offset: new BN(300), // tier 2 limit
      uri: meta[2],
    };
    const authKey = authority.publicKey;
    const levels = [level1, level2, level3];

    await ImpactNftClient.registerOffsetTiers(authKey, levels);

    const offsetTiersAddress = await ImpactNftClient.getOffsetTiersAddress(
      authKey
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
    const {
      PROGRAM_ID,
      globalState,
      TOKEN_METADATA_PROGRAM_ID,
      mint,
      metadata,
      userTokenAccount,
      masterEdition,
      offsetMetadata,
      offsetTiers,
    } = await ImpactNftClient.getMintNftAccounts(
      authority.publicKey,
      authority.publicKey
    );

    let offset = new BN(10);
    let name = "sunrise";
    let symbol = "sun";

    await client.program.methods
      .mintNft(offset, name, symbol)
      .accounts({
        payer: authority.publicKey,
        mintAuthority: authority.publicKey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadata,
        mintNftToOwner: client.provider.publicKey,
        mintNftTo: userTokenAccount,
        associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        masterEdition,
        globalState,
        offsetTiers,
        offsetMetadata,
      })
      .signers([mint])
      .rpc()
      .then(() => confirm(client.provider.connection));

    const value = await program.provider.connection
      .getTokenAccountBalance(userTokenAccount)
      .then((res) => res.value);
    assert(Number(value.amount) == 1);

    const offsetMetadataAccount = await program.account.offsetMetadata.fetch(
      offsetMetadata
    );
    assert(offsetMetadataAccount.offset.eq(new BN(10)));
  });

  /*
  it("can update an nft", async () => {
    await program.methods
      .updateNft(updatedOffset)
      .accounts({
        mintAuthority: authority.publicKey,
        mint: masterEditionMint.publicKey,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        metadata: metadataAddress,
        tokenAccount: userAssociatedTokenAccount,
        globalState: stateAddress,
        offsetTiers: offsetTiersAddress,
        offsetMetadata: offsetMetadataAddress,
      })
      .signers([authority])
      .rpc();

    let offsetMetadata = await program.account.offsetMetadata.fetch(
      offsetMetadataAddress
    );
    assert(offsetMetadata.offset.eq(updatedOffset));

    // TODO: Find a way to validate that the mpl metadata is indeed updated
  });
  */
});
