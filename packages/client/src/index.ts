import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import {AccountNamespace, AnchorProvider, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Connection,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { ImpactNft, IDL } from "./types/impact_nft";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";

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
  index: number;
}

export type RawLevel = Omit<Level, 'index'>

export type FeeConfig = {
  fee: BN; // fixed or basis point (0- 10_000)
  recipient: PublicKey;
  feeType: { percentage: {} } | { fixed: {} };
  coinType: { native: {} } | { spl: {} };
  splTokenMint: PublicKey | null;
};

type BaseMintAccounts = {
  program: PublicKey;
  tokenMetadataProgram: PublicKey;
  adminMintAuthority: PublicKey;
  tokenAuthority: PublicKey;
  metadata: PublicKey;
  userTokenAccount: PublicKey;
  masterEdition: PublicKey;
  offsetMetadata: PublicKey;
  offsetTiers: PublicKey;
};

type FeeAccounts = {
  payerTokenAccount: PublicKey | null;
  recipient: PublicKey | null;
  recipientTokenAccount: PublicKey | null;
};

type CollectionAccounts = {
  collectionMint: PublicKey;
  collectionMetadata: PublicKey;
  collectionMasterEdition: PublicKey;
};

type AllMintAccounts = BaseMintAccounts & FeeAccounts & CollectionAccounts;

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

const getOffsetTiersAddress = (stateAddress: PublicKey) =>
    PublicKey.findProgramAddressSync(
        [Buffer.from("offset_tiers"), stateAddress.toBuffer()],
        PROGRAM_ID
    )[0];

export interface ImpactNftClientConfig {
  mintAuthority: PublicKey;
  updateAuthority: PublicKey;
  tokenAuthority: PublicKey;
  levels: number;
  fee?: FeeConfig;
}

export class ImpactNftClient {
  config: ImpactNftClientConfig | undefined;
  readonly program: Program<ImpactNft>;
  state: Awaited<ReturnType<AccountNamespace<ImpactNft>['globalState']['fetchNullable']>> | undefined
  tiers: Awaited<ReturnType<AccountNamespace<ImpactNft>['offsetTiers']['fetchNullable']>> | undefined
  stateAddress: PublicKey | undefined;

  readonly metaplex: Metaplex;

  private constructor(readonly provider: AnchorProvider) {
    this.program = new Program<ImpactNft>(IDL, PROGRAM_ID, provider);
    this.metaplex = Metaplex.make(provider.connection).use(
        walletAdapterIdentity(provider.wallet)
    );
  }

  public static async register(
      adminMintAuthority: PublicKey,
      levels: number,
      fee?: FeeConfig
  ): Promise<ImpactNftClient> {
    const client = new ImpactNftClient(setUpAnchor());
    const stateKey = Keypair.generate();

    const tokenAuthority = client.getTokenAuthorityAddress(stateKey.publicKey);
    const accounts = {
      payer: client.provider.publicKey,
      adminUpdateAuthority: client.provider.publicKey,
      globalState: stateKey.publicKey,
      tokenAuthority,
      systemProgram: SystemProgram.programId,
    };

    await client.program.methods
        .createGlobalState({
          adminMintAuthority,
          levels,
          fee: fee || null,
        })
        .accounts(accounts)
        .signers([stateKey])
        .rpc()
        .then(() => confirm(client.provider.connection));

    console.log("Created global state", stateKey.publicKey.toBase58());

    console.log("initialising...")
    await client.init(stateKey.publicKey);

    console.log("initialised")
    return client;
  }

  public static async get(
      provider: AnchorProvider,
      stateAddress: PublicKey
  ): Promise<ImpactNftClient> {
    const client = new ImpactNftClient(provider);
    await client.init(stateAddress);
    return client;
  }

  private async init(stateAddress: PublicKey): Promise<void> {
    this.stateAddress = stateAddress;
    this.state = await this.program.account.globalState.fetch(stateAddress);

    const tiersAddress = this.getOffsetTiersAddress();
    this.tiers = await this.program.account.offsetTiers.fetchNullable(tiersAddress);

    const tokenAuthority = this.getTokenAuthorityAddress(stateAddress);

    this.config = {
      mintAuthority: this.state.adminMintAuthority,
      updateAuthority: this.state.adminUpdateAuthority,
      tokenAuthority,
      levels: this.state.levels as number,
      fee: this.state.fee as FeeConfig,
    };
  }

  public details() {
    if (!this.state) throw new Error("not initialized");

    return {
      state: this.state,
      levels: this.levels,
    };
  }

  public getTokenAuthorityAddress(state: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("token_authority"), state.toBuffer()],
        PROGRAM_ID
    )[0];
  }

  public getOffsetTiersAddress(): PublicKey {
    if (!this.stateAddress) throw new Error("Client not initialized");
    return getOffsetTiersAddress(this.stateAddress);
  }

  public getOffsetMetadataAddress(mint: PublicKey): PublicKey {
    if (!this.stateAddress) throw new Error("Client not initialized");
    return PublicKey.findProgramAddressSync(
        [
          Buffer.from("offset_metadata"),
          mint.toBuffer(),
          this.stateAddress.toBuffer(),
        ],
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

  public async createCollectionMint(
      uri: string,
      name: string
  ): Promise<Keypair> {
    if (!this.config) throw new Error("Client not initialized");
    const mint = Keypair.generate();

    const { nft } = await this.metaplex.nfts().create({
      uri,
      name,
      sellerFeeBasisPoints: 100,
      useNewMint: mint,
      isCollection: true,
    });

    await this.metaplex.nfts().update({
      nftOrSft: nft,
      newUpdateAuthority: this.config.tokenAuthority,
    });

    return mint;
  }

  public async registerOffsetTiers(levels: RawLevel[]) {
    if (!this.stateAddress) throw new Error("Client not initialized");

    // get state account
    const offsetTiersAddress = this.getOffsetTiersAddress();

    await this.program.methods
        .createOffsetTiers({
          levels,
        })
        .accounts({
          adminUpdateAuthority: this.provider.publicKey,
          globalState: this.stateAddress,
          offsetTiers: offsetTiersAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
        .then(() => confirm(this.provider.connection));

    this.tiers = await this.program.account.offsetTiers.fetchNullable(offsetTiersAddress);
  }

  public async addLevelsToOffsetTiers(levels: RawLevel[]) {
    if (!this.stateAddress) throw new Error("Client not initialized");

    const offsetTiersAddress = this.getOffsetTiersAddress();
    await this.program.methods
        .addLevels(levels)
        .accounts({
          adminUpdateAuthority: this.provider.publicKey,
          globalState: this.stateAddress,
          offsetTiers: offsetTiersAddress,
        })
        .rpc()
        .then(() => confirm(this.provider.connection));

    this.tiers = await this.program.account.offsetTiers.fetchNullable(offsetTiersAddress);
  }

  public async getMintNftAccounts(
      mint: PublicKey,
      user: PublicKey
  ): Promise<AllMintAccounts> {
    if (!this.stateAddress || !this.config)
      throw new Error("Client not initialized");

    const metadata = this.getMetadataAddress(mint);
    const masterEdition = this.getMasterEditionAddress(mint);
    const offsetMetadata = this.getOffsetMetadataAddress(mint);
    const offsetTiers = this.getOffsetTiersAddress();
    const userTokenAccount = getAssociatedTokenAddressSync(mint, user, true);

    const collectionAccounts = await this.getCollectionAccounts();
    const feeAccounts = this.getFeeAccounts(user);

    return {
      program: PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      adminMintAuthority: this.config.mintAuthority,
      tokenAuthority: this.getTokenAuthorityAddress(this.stateAddress),
      metadata,
      userTokenAccount,
      masterEdition,
      offsetMetadata,
      offsetTiers,
      ...collectionAccounts,
      ...feeAccounts,
    };
  }
  private getFeeAccounts(user: PublicKey): FeeAccounts {
    if (!this.config) throw new Error("Client not initialized");
    const feeAccounts: FeeAccounts = {
      payerTokenAccount: null,
      recipient: null,
      recipientTokenAccount: null,
    };
    if (this.config.fee) {
      if (this.config.fee.coinType.hasOwnProperty("spl")) {
        if (!this.config.fee.splTokenMint)
          throw new Error("No spl token mint provided for fee of type SPL");
        feeAccounts.payerTokenAccount = getAssociatedTokenAddressSync(
            this.config.fee.splTokenMint,
            user,
            true
        );

        feeAccounts.recipientTokenAccount = getAssociatedTokenAddressSync(
            this.config.fee.splTokenMint,
            this.config.fee.recipient,
            true
        );
      } else {
        feeAccounts.recipient = this.config.fee.recipient;
      }
    }

    return feeAccounts;
  }

  public getLevelForOffset(offset: anchor.BN): Level | null {
    if (!this.tiers) throw new Error("Client not initialized");
    // search backwards so we get the highest level
    const level = this.levels
        .reverse()
        .find((level, index) => offset.gte(level.offset));
    return level || null;
  }

  public getAmountToNextOffset(offset: anchor.BN): anchor.BN | null {
    if (!this.tiers) throw new Error("Client not initialized");
    const level = this.getLevelForOffset(offset);
    if (!level) return null;
    const nextLevel = this.levels[level.index + 1];
    if (!nextLevel) return null;
    return nextLevel.offset.sub(offset);
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

    const newCollectionMint = await this.getUpdateCollectionForOffset(offset);
    if (newCollectionMint === null)
      throw new Error("No levels in offset tiers");
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
    if (!this.stateAddress || !this.tiers) throw new Error("Client not initialized");

    let offsetMetadata = this.getOffsetMetadataAddress(mint);
    let index = await this.program.account.offsetMetadata
        .fetch(offsetMetadata)
        .then((res) => res.currentLevelIndex);

    let levels = this.tiers.levels as Level[];

    return levels[index].collectionMint;
  }

  // Mirrors offsetTiers.getLevel()
  private async getUpdateCollectionForOffset(
      offset: anchor.BN
  ): Promise<PublicKey | null> {
    const level = this.getLevelForOffset(offset);
    return level?.collectionMint || null;
  }

  public get levels(): Level[] {
    if (!this.tiers) throw new Error("Client not initialized");
    const rawLevels = this.tiers.levels as RawLevel[];

    // add the index to each level
    return rawLevels.map((level, index) => ({
        ...level,
        index,
    }));
  }

  private async getCollectionAccounts() {
    if (!this.tiers) throw new Error("Client not initialized");
    const levels = this.tiers.levels as Level[];
    const collectionMint = levels[0].collectionMint;
    const collectionMetadata = this.getMetadataAddress(collectionMint);
    const collectionMasterEdition =
        this.getMasterEditionAddress(collectionMint);

    return {
      collectionMint,
      collectionMetadata,
      collectionMasterEdition,
    };
  }

  public async mintNft(
      mint: Keypair,
      mintAuthority: Keypair,
      user: PublicKey,
      initialOffset: BN,
      principal: BN
  ) {
    const mintNftAccounts = await this.getMintNftAccounts(mint.publicKey, user);
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

    const accounts = {
      ...mintNftAccounts,
      payer: this.provider.publicKey,
      mint: mint.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      mintNftToOwner: user,
      mintNftTo: mintNftAccounts.userTokenAccount,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      globalState: this.stateAddress,
    };

    return this.program.methods
        .mintNft(initialOffset, principal)
        .accounts(accounts)
        .preInstructions([modifyComputeUnits])
        .signers([mint, mintAuthority])
        .rpc();
  }

  public async updateNft(
        mint: Keypair,
        mintAuthority: Keypair,
        user: PublicKey,
        updatedOffset: BN,
  ) {
    const accounts = await this.getMintNftAccounts(
        mint.publicKey,
        user
    );
    const updateAccounts = await this.getUpdateNftAccounts(
        mint.publicKey,
        updatedOffset
    );

    return this.program.methods
        .updateNft(updatedOffset)
        .accounts({
          ...accounts,
          ...updateAccounts,
          globalState: this.stateAddress,
          mint: mint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([mintAuthority])
        .rpc();
  }
}
