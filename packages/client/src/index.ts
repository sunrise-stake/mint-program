import { AnchorProvider, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";
import { ImpactNft, IDL } from "./types/impact_nft";
import {getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import BN from "bn.js";
import * as spl from "@solana/spl-token";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const PROGRAM_ID = new PublicKey(
    "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc"
);

export type FeeConfig = {
  fee: BN // fixed or basis point (0- 10_000)
  recipient: PublicKey,
  feeType: { percentage: {} } | { fixed: {} }
  coinType: { native: {} } | { spl: {} }
  splTokenMint: PublicKey | null
}

interface Level {
  offset: anchor.BN;
  uri: string;
  name: string;
  symbol: string;
}

type FeeAccounts = {
  payerTokenAccount: PublicKey | null;
  recipient: PublicKey | null;
  recipientTokenAccount: PublicKey | null;
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
      mintAuthority: PublicKey,
      levels: number,
      fee?: FeeConfig
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

    this.config = {
      mintAuthority: state.mintAuthority,
      adminAuthority: state.adminAuthority,
      levels: state.levels as number,
      fee: state.fee as FeeConfig,
    };

    console.log("client initialized", this.config)

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

  public getOffsetMetadataAddress(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("offset_metadata"), mint.toBuffer()],
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
    feePayerTokenAccount?: PublicKey;
    recipientSolAccount?: PublicKey;
    recipientTokenAccount?: PublicKey;
  } {
    if (!this.stateAddress || !this.config)
      throw new Error("Client not initialized");

    const metadata = this.getMetadataAddress(mint);
    const masterEdition = this.getMasterEditionAddress(mint);
    const offsetMetadata = this.getOffsetMetadataAddress(mint);
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

  public async mintNft(mint: Keypair, mintAuthority: Keypair, user: PublicKey, initialOffset: BN, principal: BN) {
    const mintNftAccounts = this.getMintNftAccounts(
        mint.publicKey,
        user
    );
    const feeAccounts = this.getFeeAccounts(user);
    const accounts = {
      ...mintNftAccounts,
      ...feeAccounts,
      payer: this.provider.publicKey,
      mint: mint.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      mintNftToOwner: user,
      mintNftTo: mintNftAccounts.userTokenAccount,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      globalState: this.stateAddress,
    };
    console.log("accounts", accounts);

    return this.program.methods
        .mintNft(initialOffset, principal)
        .accounts(accounts)
        .signers([mint, mintAuthority])
        .rpc()
  }
}
