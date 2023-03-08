import { AnchorProvider, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Connection, ComputeBudgetProgram } from "@solana/web3.js";
import { ImpactNft, IDL } from "./types/impact_nft";
import {ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID} from "@solana/spl-token";
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
}

export type FeeConfig = {
  fee: BN // fixed or basis point (0- 10_000)
  recipient: PublicKey,
  feeType: { percentage: {} } | { fixed: {} }
  coinType: { native: {} } | { spl: {} }
  splTokenMint: PublicKey | null
}

type FeeAccounts = {
  payerTokenAccount: PublicKey | null;
  recipient: PublicKey | null;
  recipientTokenAccount: PublicKey | null;
}

type CollectionAccounts = {
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
  updateAuthority: PublicKey;
  tokenAuthority: PublicKey;
  levels: number;
  fee?: FeeConfig;
}

export class ImpactNftClient {
  config: ImpactNftClientConfig | undefined;
  readonly program: Program<ImpactNft>;
  stateAddress: PublicKey | undefined;

  private constructor(readonly provider: AnchorProvider) {
    this.program = new Program<ImpactNft>(IDL, PROGRAM_ID, provider);
  }

  public static async register(
      adminMintAuthority: PublicKey,
      levels: number,
      fee?: FeeConfig
  ): Promise<ImpactNftClient> {
    const client = new ImpactNftClient(setUpAnchor());
    const state = Keypair.generate();

    const tokenAuthority = client.getTokenAuthorityAddress(state.publicKey);
    const accounts = {
      payer: client.provider.publicKey,
      adminUpdateAuthority: client.provider.publicKey,
      globalState: state.publicKey,
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
    const tokenAuthority = this.getTokenAuthorityAddress(stateAddress);

    this.config = {
      mintAuthority: state.adminMintAuthority,
      updateAuthority: state.adminUpdateAuthority,
      tokenAuthority,
      levels: state.levels as number,
      fee: state.fee as FeeConfig,
    };

    this.stateAddress = stateAddress;
  }

  public async details() {
    if (!this.stateAddress) throw new Error("not initialized");

    const state = await this.program.account.globalState.fetch(this.stateAddress);

    const tiersAddress = this.getOffsetTiersAddress();
    const tiers = await this.program.account.offsetTiers.fetch(tiersAddress);

    return {
      state,
      tiers
    }
  }

  public getTokenAuthorityAddress(state: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("token_authority"), state.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  public getOffsetTiersAddress(): PublicKey {
    if (!this.stateAddress) throw new Error("Client not initialized");
    return PublicKey.findProgramAddressSync(
        [Buffer.from("offset_tiers"), this.stateAddress.toBuffer()],
        PROGRAM_ID
    )[0];
  }

  public getOffsetMetadataAddress(
    mint: PublicKey
  ): PublicKey {
    if (!this.stateAddress) throw new Error("Client not initialized");
    return PublicKey.findProgramAddressSync(
        [Buffer.from("offset_metadata"), mint.toBuffer(), this.stateAddress.toBuffer()],
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
    const offsetTiers = this.getOffsetTiersAddress();

    const client = new ImpactNftClient(setUpAnchor());

    await client.program.methods
        .createOffsetTiers({
          levels,
        })
        .accounts({
          adminUpdateAuthority: client.provider.publicKey,
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
    adminMintAuthority: PublicKey;
    tokenAuthority: PublicKey;
    metadata: PublicKey;
    userTokenAccount: PublicKey;
    masterEdition: PublicKey;
    offsetMetadata: PublicKey;
    offsetTiers: PublicKey;
    feePayerTokenAccount?: PublicKey;
    recipientSolAccount?: PublicKey;
    recipientTokenAccount?: PublicKey;
  } {
    if (!this.stateAddress || !this.config)
      throw new Error("Client not initialized");

    const metadata = this.getMetadataAddress(mint);
    const masterEdition = this.getMasterEditionAddress(mint);
    const offsetMetadata = this.getOffsetMetadataAddress(
      mint
    );
    const offsetTiers = this.getOffsetTiersAddress();
    const userTokenAccount = getAssociatedTokenAddressSync(mint, user, true);

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
    };
  }
  private getFeeAccounts(user: PublicKey):FeeAccounts {
    if (!this.config) throw new Error("Client not initialized");
    const feeAccounts:FeeAccounts = {
      payerTokenAccount: null,
      recipient: null,
      recipientTokenAccount: null
    }
    if (this.config.fee) {
      if (this.config.fee.coinType.hasOwnProperty("spl")) {
        if (!this.config.fee.splTokenMint) throw new Error("No spl token mint provided for fee of type SPL");
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

    return feeAccounts
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

    let offsetMetadata = this.getOffsetMetadataAddress(mint);
    let index = await this.program.account.offsetMetadata
      .fetch(offsetMetadata)
      .then((res) => res.currentLevelIndex);

    let offsetTiers = this.getOffsetTiersAddress();
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

    let offsetTiers = this.getOffsetTiersAddress();
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

  private async getCollectionAccounts() {
    const {tiers} = await this.details();
    const levels = tiers.levels as { collectionMint: PublicKey }[];
    const collectionMint = levels[0].collectionMint;
    const collectionMetadata = this.getMetadataAddress(collectionMint);
    const collectionMasterEdition =
        this.getMasterEditionAddress(collectionMint);

    return {
      collectionMint,
      collectionMetadata,
      collectionMasterEdition
    }
  }

  public async mintNft(mint: Keypair, mintAuthority: Keypair, user: PublicKey, initialOffset: BN, principal: BN) {
    const mintNftAccounts = this.getMintNftAccounts(
        mint.publicKey,
        user
    );
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

    const collectionAccounts = await this.getCollectionAccounts();

    const feeAccounts = this.getFeeAccounts(user);
    const accounts = {
      ...mintNftAccounts,
      ...feeAccounts,
      ...collectionAccounts,
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
    console.log("accounts", accounts);

    return this.program.methods
        .mintNft(initialOffset, principal)
        .accounts(accounts)
        .preInstructions([modifyComputeUnits])
        .signers([mint, mintAuthority])
        .rpc()
  }
}
