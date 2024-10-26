import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ImpactNft } from "../client/src/types/impact_nft";
import { expect, assert } from "chai";
import BN from "bn.js";
import { ImpactNftClient, Level } from "../client/src";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getTestMetadata } from "./util";

const program = anchor.workspace.ImpactNft as Program<ImpactNft>;

// This would typically be a PDA owned by a different program
// e.g. the sunrise program
const mintAuthority = Keypair.generate();

const makeTestLevels = async (client: ImpactNftClient): Promise<Level[]> => {
  const metadata = getTestMetadata();

  const levels = new Array<Level>();

  for (let i = 0; i < metadata.length; ++i) {
    const mint = await client.createCollectionMint(
      metadata[i],
      `sunriseStake${i}Collection`
    );
    const level: Level = {
      offset: new BN(i).muln(100),
      uri: metadata[i],
      name: `sunriseStake${i}`,
      symbol: `sun${i}`,
      collectionMint: mint.publicKey,
      index: i,
    };
    levels.push(level);
  }

  // creates levels 0,100,200,300,400,500
  console.log(
    "Created levels: ",
    levels.map((l) => l.offset.toString()).join(", ")
  );

  return levels;
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

  let levels: Level[];

  const principal = new BN(100); // used to calculate the fee
  const initialOffset = new BN(40); // should still default to a level0 nft
  const updatedOffset = new BN(120); // should upgrade to a level 1 nft
  const level2Offset = new BN(220); // should upgrade to a level 2 nft
  const aboveHighestOffset = new BN(10000); // should upgrade to a level 5 nft

  const mint = Keypair.generate();

  it("Can register a new global state without fees", async () => {
    const levels = 3;
    client = await ImpactNftClient.register(
      mintAuthority.publicKey,
      levels,
      null
    );

    expect(client.stateAddress).not.to.be.null;

    expect(client.state.adminMintAuthority.toBase58()).equal(
      mintAuthority.publicKey.toBase58()
    );
    expect(client.state.adminUpdateAuthority.toBase58()).equal(
      client.provider.publicKey.toBase58()
    );
    expect(client.state.levels).equal(levels);
    expect(client.state.fee).to.equal(null);
  });

  it("Can create offset tiers", async () => {
    levels = await makeTestLevels(client);
    await client.registerOffsetTiers(levels.slice(0, 3));

    const tiers = client.tiers;

    assert((tiers.levels[0].offset as BN).eq(levels[0].offset));
    assert((tiers.levels[1].offset as BN).eq(levels[1].offset));
    assert((tiers.levels[2].offset as BN).eq(levels[2].offset));

    assert((tiers.levels[0].uri as string) == levels[0].uri);
    assert((tiers.levels[1].uri as string) == levels[1].uri);
    assert((tiers.levels[2].uri as string) == levels[2].uri);
  });

  it("Can add to offset tiers", async () => {
    await client.addLevelsToOffsetTiers(levels.slice(3, 6));

    const tiers = client.tiers;

    assert((tiers.levels[3].uri as string) == levels[3].uri);
    assert((tiers.levels[4].uri as string) == levels[4].uri);
    assert((tiers.levels[5].uri as string) == levels[5].uri);
  });

  it("can mint an nft and update its offset", async () => {
    await client.mintNft(
      mint,
      mintAuthority,
      user.publicKey,
      initialOffset,
      principal
    );
    const mintNftAccounts = await client.getMintNftAccounts(
      mint.publicKey,
      user.publicKey
    );

    const value = await program.provider.connection
      .getTokenAccountBalance(mintNftAccounts.userTokenAccount)
      .then((res) => res.value);
    expect(Number(value.amount)).to.equal(1);

    const offsetMetadataAccount = await program.account.offsetMetadata.fetch(
      mintNftAccounts.offsetMetadata
    );
    expect(offsetMetadataAccount.offset.toNumber()).to.equal(
      initialOffset.toNumber()
    );
  });

  it("should calculate the current level", () => {
    expect(client.getLevelForOffset(initialOffset).index).to.equal(0);
    expect(client.getLevelForOffset(updatedOffset).index).to.equal(1);
    expect(client.getLevelForOffset(level2Offset).index).to.equal(2);
    expect(client.getLevelForOffset(aboveHighestOffset).index).to.equal(5);
  });

  it("should calculate the amount needed to reach the next level", () => {
    expect(client.getAmountToNextOffset(initialOffset)?.toNumber()).to.equal(
      60
    );
    expect(client.getAmountToNextOffset(updatedOffset)?.toNumber()).to.equal(
      80
    );
    expect(client.getAmountToNextOffset(level2Offset)?.toNumber()).to.equal(80);
    expect(client.getAmountToNextOffset(aboveHighestOffset)).to.be.null;

    // the first level is at 0
    // we support starting at a negative offset
    expect(client.getAmountToNextOffset(new BN(-50)).toNumber()).to.equal(50);

    // if a current level is passed, use that level rather than assuming the level from the offset
    expect(client.getAmountToNextOffset(updatedOffset, 0)?.toNumber()).to.equal(
        -20
    );
  });

  it("can update an nft", async () => {
    await client.updateNft(mint, mintAuthority, user.publicKey, updatedOffset);

    const offsetMetadataAddress = client.getOffsetMetadataAddress(
      mint.publicKey
    );

    let offsetMetadata = await program.account.offsetMetadata.fetch(
      offsetMetadataAddress
    );
    assert(offsetMetadata.offset.eq(updatedOffset));

    // TODO: Find a way to validate that the mpl metadata is indeed updated
  });

  context("with sol fees", () => {
    const user = Keypair.generate();
    const mint = Keypair.generate();
    const feeRecipient = Keypair.generate();
    const feeBasisPoints = new BN(100); // 1%
    const initialRecipientBalance = 1_000_000;

    before("fund the user and recipient with SOL", async () => {
      await program.provider.connection
        .requestAirdrop(user.publicKey, LAMPORTS_PER_SOL)
        .then(async (sig) =>
          program.provider.connection.confirmTransaction(sig)
        );

      // we have to fund the recipient, as the fee is insufficient to meet rent on its own
      // zero balance is ok, 1 balance is not ok
      await program.provider.connection
        .requestAirdrop(feeRecipient.publicKey, initialRecipientBalance)
        .then(async (sig) =>
          program.provider.connection.confirmTransaction(sig)
        );
    });

    it("Can register a new global state with SOL fees", async () => {
      const levels = await makeTestLevels(client);
      const feeConfig = {
        fee: feeBasisPoints,
        recipient: feeRecipient.publicKey,
        feeType: { percentage: {} }, // alt: { fixed: {} }
        coinType: { native: {} }, // alt: { spl: {} }
        splTokenMint: null,
      };
      client = await ImpactNftClient.register(
        mintAuthority.publicKey,
        levels.length,
        feeConfig
      );
      await client.registerOffsetTiers(levels.slice(0, 5));

      const { state } = client.details();
      expect(state.fee.fee.toNumber()).to.equal(feeConfig.fee.toNumber());
      expect(state.fee.feeType).to.deep.equal({ percentage: {} });
    });

    // re-enable once fees are supported
    it.skip("Can mint an nft and charge a fee", async () => {
      await client.mintNft(
        mint,
        mintAuthority,
        user.publicKey,
        initialOffset,
        principal
      );

      // check if the fee was paid
      const value = await program.provider.connection.getBalance(
        feeRecipient.publicKey
      );
      expect(value).to.equal(
        initialRecipientBalance +
          principal.toNumber() * (feeBasisPoints.toNumber() / 10_000)
      ); // 1% of the principal
    });
  });
});
