import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ImpactNft } from "../client/src/types/impact_nft";
import { expect } from "chai";
import BN from "bn.js";
import { ImpactNftClient } from "../client/src";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { getTestMetadata } from "./util";
import { assert } from "chai";

const program = anchor.workspace.ImpactNft as Program<ImpactNft>;
// This would typically be a PDA onwed by a different program
// e.g. the sunrise program
const mintAuthority = Keypair.generate();

const makeLevels = () => {
  const meta = getTestMetadata();

  const level1 = {
    offset: new BN(100), // tier 0 limit
    uri: meta[0],
    name: "sunriseStake0",
    symbol: "sun0",
  };
  const level2 = {
    offset: new BN(200), // tier 1 limit
    uri: meta[1],
    name: "sunriseStake1",
    symbol: "sun1",
  };
  const level3 = {
    offset: new BN(300), // tier 2 limit
    uri: meta[2],
    name: "sunriseStake2",
    symbol: "sun2",
  };

  return [level1, level2, level3];
}

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

  const principal = new BN(100); // used to calculate the fee
  const initialOffset = new BN(140); // should still default to a level0 nft
  const updatedOffset = new BN(180); // should upgrade to a level1 nft

  const mint = Keypair.generate();

  it("Can register a new global state without fees", async () => {
    const levels = 3;
    client = await ImpactNftClient.register(mintAuthority.publicKey, levels, null);

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
    expect(state.fee).to.equal(null);
  });

  it("Can create offset tiers", async () => {
    const levels = makeLevels();
    await client.registerOffsetTiers(levels);

    const offsetTiersAddress = client.getOffsetTiersAddress(
      client.stateAddress
    );

    let tiers = await program.account.offsetTiers.fetch(offsetTiersAddress);

    assert((tiers.levels[0].offset as BN).eq(levels[0].offset));
    assert((tiers.levels[1].offset as BN).eq(levels[1].offset));
    assert((tiers.levels[2].offset as BN).eq(levels[2].offset));

    assert((tiers.levels[0].uri as string) == levels[0].uri);
    assert((tiers.levels[1].uri as string) == levels[1].uri);
    assert((tiers.levels[2].uri as string) == levels[2].uri);
  });

  it("can mint an nft and update its offset", async () => {
    await client.mintNft(mint, mintAuthority, user.publicKey, initialOffset, principal);
    const mintNftAccounts = client.getMintNftAccounts(
      mint.publicKey,
      user.publicKey
    );

    const value = await program.provider.connection
      .getTokenAccountBalance(mintNftAccounts.userTokenAccount)
      .then((res) => res.value);
    expect(Number(value.amount) ).to.equal(1);

    const offsetMetadataAccount = await program.account.offsetMetadata.fetch(
      mintNftAccounts.offsetMetadata
    );
    expect(offsetMetadataAccount.offset.toNumber()).to.equal(initialOffset.toNumber());
  });

  it("can update an nft", async () => {
    let accounts = client.getMintNftAccounts(mint.publicKey, user.publicKey);



    await program.methods
      .updateNft(updatedOffset)
      .accounts({
        ...accounts,
        globalState: client.stateAddress,
        mint: mint.publicKey,
      })
      .signers([mintAuthority])
      .rpc();

    let offsetMetadata = await program.account.offsetMetadata.fetch(
      accounts.offsetMetadata
    );
    assert(offsetMetadata.offset.eq(updatedOffset));

    // TODO: Find a way to validate that the mpl metadata is indeed updated
  });

  context('with sol fees', () => {
    const user = Keypair.generate();
    const mint = Keypair.generate();
    const feeRecipient = Keypair.generate();
    const feeBasisPoints = new BN(100); // 1%
      const initialRecipientBalance = 1_000_000;

    before('fund the user and recipient with SOL', async () => {
        await program.provider.connection
            .requestAirdrop(user.publicKey, LAMPORTS_PER_SOL)
            .then(async (sig) => program.provider.connection.confirmTransaction(sig));

        // we have to fund the recipient, as the fee is insufficient to meet rent on its own
      // zero balance is ok, 1 balance is not ok
      await program.provider.connection
          .requestAirdrop(feeRecipient.publicKey, initialRecipientBalance)
          .then(async (sig) => program.provider.connection.confirmTransaction(sig));
    });

    it("Can register a new global state with SOL fees", async () => {
      const levels = makeLevels();
      const feeConfig = {
        fee: feeBasisPoints,
        recipient: feeRecipient.publicKey,
        feeType: {percentage: {}},// alt: { fixed: {} }
        coinType: { native: {}}, // alt: { spl: {} }
        splTokenMint: null,
      }
      client = await ImpactNftClient.register(mintAuthority.publicKey, levels.length, feeConfig);
      await client.registerOffsetTiers(levels);

      const {state} = await client.details();
      expect(state.fee.fee.toNumber()).to.equal(
        feeConfig.fee.toNumber()
      );
      expect(state.fee.feeType).to.deep.equal(
          {percentage: {}}
      );
    });

    it("Can mint an nft and charge a fee", async () => {
      await client.mintNft(mint, mintAuthority, user.publicKey, initialOffset, principal);

      // check if the fee was paid
      const value = await program.provider.connection
          .getBalance(feeRecipient.publicKey)
      expect(value).to.equal(initialRecipientBalance + (principal.toNumber() * (feeBasisPoints.toNumber()/10_000)));  // 1% of the principal
    });
  });
});
