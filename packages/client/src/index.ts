import { AnchorProvider, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";
import { ImpactNft, IDL } from "./types/impact_nft";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const PROGRAM_ID = new PublicKey(
  "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc"
);

export interface Level {
  offset: anchor.BN;
  uri: string;
  name: string;
  symbol: string;
  collectionMint: PublicKey;
}

export const confirm = (connection: Connection) => async (txSig: string) =>
  connection.confirmTransaction({
    signature: txSig,
    ...(await connection.getLatestBlockhash()),
  });

export const setUpAnchor = (): anchor.AnchorProvider => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  return provider;
};

export interface ImpactNftClientConfig {
  mintAuthority: PublicKey;
  adminAuthority: PublicKey;
  levels: number;
}

export class ImpactNftClient {
  config: ImpactNftClientConfig | undefined;
  readonly program: Program<ImpactNft>;
  stateAddress: PublicKey | undefined;

  private constructor(readonly provider: AnchorProvider) {
    this.program = new Program<ImpactNft>(IDL, PROGRAM_ID, provider);
  }

  public static async register(
    mintAuthority: PublicKey,
    levels: number
  ): Promise<ImpactNftClient> {
    const client = new ImpactNftClient(setUpAnchor());
    const state = Keypair.generate();

    const accounts = {
      payer: client.provider.publicKey,
      adminAuthority: client.provider.publicKey,
      globalState: state.publicKey,
      systemProgram: SystemProgram.programId,
    };

    await client.program.methods
      .createGlobalState({
        mintAuthority,
        levels,
      })
      .accounts(accounts)
      .signers([state])
      .rpc()
      .then(() => confirm(client.provider.connection));

    await client.init(state.publicKey);

    return client;
  }

  public static async get(provider: AnchorProvider, stateAddress: PublicKey): Promise<ImpactNftClient> {
    const client = new ImpactNftClient(provider);
    await client.init(stateAddress);
    return client;
  }

  private async init(stateAddress: PublicKey): Promise<void> {
    const state = await this.program.account.globalState.fetch(stateAddress);

    this.config = {
      mintAuthority: state.mintAuthority,
      adminAuthority: state.adminAuthority,
      levels: state.levels as number,
    };

    this.stateAddress = stateAddress;
  }

  public async details() {
    if (!this.stateAddress) throw new Error("not initialized");

    const state = await this.program.account.globalState.fetch(this.stateAddress);

    const tiersAddress = this.getOffsetTiersAddress(this.stateAddress);
    const tiers = await this.program.account.offsetTiers.fetch(tiersAddress);

    return {
        state,
        tiers
    }
  }

  public getOffsetTiersAddress(state: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("offset_tiers"), state.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  public getOffsetMetadataAddress(
    mint: PublicKey,
    state: PublicKey
  ): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("offset_metadata"), mint.toBuffer(), state.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  /** get metadata account... can't find an easy way to do this via their sdk */
  public getMetadataAddress(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  }

  /** get master edition account... can't find an easy way to do this via their sdk */
  public getMasterEditionAddress(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  }

  public async registerOffsetTiers(levels: Level[]) {
    if (!this.stateAddress) throw new Error("Client not initialized");

    // get state account
    const offsetTiers = this.getOffsetTiersAddress(this.stateAddress);

    const client = new ImpactNftClient(setUpAnchor());

    await client.program.methods
      .createOffsetTiers({
        levels,
      })
      .accounts({
        adminAuthority: client.provider.publicKey,
        globalState: this.stateAddress,
        offsetTiers,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
      .then(() => confirm(client.provider.connection));
  }

  public getMintNftAccounts(
    mint: PublicKey,
    user: PublicKey
  ): {
    program: PublicKey;
    tokenMetadataProgram: PublicKey;
    mintAuthority: PublicKey;
    metadata: PublicKey;
    userTokenAccount: PublicKey;
    masterEdition: PublicKey;
    offsetMetadata: PublicKey;
    offsetTiers: PublicKey;
  } {
    if (!this.stateAddress || !this.config)
      throw new Error("Client not initialized");

    const metadata = this.getMetadataAddress(mint);
    const masterEdition = this.getMasterEditionAddress(mint);
    const offsetMetadata = this.getOffsetMetadataAddress(
      mint,
      this.stateAddress
    );
    const offsetTiers = this.getOffsetTiersAddress(this.stateAddress);
    const userTokenAccount = getAssociatedTokenAddressSync(mint, user, true);

    return {
      program: PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      mintAuthority: this.config.mintAuthority,
      metadata,
      userTokenAccount,
      masterEdition,
      offsetMetadata,
      offsetTiers,
    };
  }

  public async getUpdateNftAccounts(
    mint: PublicKey,
    offset: anchor.BN
  ): Promise<{
    collectionMint: PublicKey;
    collectionMetadata: PublicKey;
    collectionMasterEdition: PublicKey;
    newCollectionMint: PublicKey;
    newCollectionMetadata: PublicKey;
    newCollectionMasterEdition: PublicKey;
    tokenMetadataProgram: PublicKey;
  }> {
    if (!this.stateAddress || !this.config)
      throw new Error("Client not initialized");

    const collectionMint = await this.getCurrentCollectionForMint(mint);
    const collectionMetadata = this.getMetadataAddress(collectionMint);
    const collectionMasterEdition =
      this.getMasterEditionAddress(collectionMint);

    const newCollectionMint = await this.getNewCollectionForOffset(offset);
    const newCollectionMetadata = this.getMetadataAddress(newCollectionMint);
    const newCollectionMasterEdition =
      this.getMasterEditionAddress(newCollectionMint);

    return {
      collectionMint,
      collectionMetadata,
      collectionMasterEdition,
      newCollectionMint,
      newCollectionMetadata,
      newCollectionMasterEdition,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    };
  }

  private async getCurrentCollectionForMint(
    mint: PublicKey
  ): Promise<PublicKey> {
    if (!this.stateAddress) throw new Error("Client not initialized");

    let offsetMetadata = this.getOffsetMetadataAddress(mint, this.stateAddress);
    let index = await this.program.account.offsetMetadata
      .fetch(offsetMetadata)
      .then((res) => res.currentLevelIndex);

    let offsetTiers = this.getOffsetTiersAddress(this.stateAddress);
    let levels = (await this.program.account.offsetTiers
      .fetch(offsetTiers)
      .then((res) => res.levels)) as Level[];

    return levels[index].collectionMint;
  }

  // Mirrors OffsetTiers.get_level() in program
  private async getNewCollectionForOffset(
    offsetAmount: anchor.BN
  ): Promise<PublicKey> {
    if (!this.stateAddress) throw new Error("Client not initialized");

    let offsetTiers = this.getOffsetTiersAddress(this.stateAddress);
    let levels = (await this.program.account.offsetTiers
      .fetch(offsetTiers)
      .then((res) => res.levels)) as Level[];

    let index = 0;

    for (let i = 0; i < levels.length; i++) {
      if (levels[i].offset > offsetAmount) {
        index = i;
        break;
      }
    }

    if (index != 0) {
      return levels[index - 1].collectionMint;
    }
    return levels[0].collectionMint;
  }
}
