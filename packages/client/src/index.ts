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

interface Level {
  offset: anchor.BN;
  uri: string;
  name: string;
  symbol: string;
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
  authority: PublicKey;
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
    authority: PublicKey,
    levels: number
  ): Promise<ImpactNftClient> {
    const client = new ImpactNftClient(setUpAnchor());
    const state = Keypair.generate();

    const accounts = {
      payer: client.provider.publicKey,
      globalState: state.publicKey,
      systemProgram: SystemProgram.programId,
    };

    await client.program.methods
      .createGlobalState({
        authority,
        levels,
      })
      .accounts(accounts)
      .signers([state])
      .rpc()
      .then(() => confirm(client.provider.connection));

    await client.init(state.publicKey);

    return client;
  }

  private async init(stateAddress: PublicKey): Promise<void> {
    const state = await this.program.account.globalState.fetch(stateAddress);

    this.config = {
      authority: state.authority,
      levels: state.levels as number,
    };

    this.stateAddress = stateAddress;
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

  public async registerOffsetTiers(authority: PublicKey, levels: Level[]) {
    if (!this.stateAddress) throw new Error("Client not initialized");

    // get state account
    const offsetTiers = this.getOffsetTiersAddress(this.stateAddress);

    const client = new ImpactNftClient(setUpAnchor());

    await client.program.methods
      .createOffsetTiers({
        authority,
        levels,
      })
      .accounts({
        authority: client.provider.publicKey,
        globalState: this.stateAddress,
        offsetTiers,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
      .then(() => confirm(client.provider.connection));
  }

  public getMintNftAccounts(
      authority: PublicKey,
    mint: PublicKey,
    user: PublicKey
  ): {
    program: PublicKey;
    tokenMetadataProgram: PublicKey;
    metadata: PublicKey;
    userTokenAccount: PublicKey;
    masterEdition: PublicKey;
    offsetMetadata: PublicKey;
    offsetTiers: PublicKey;
  } {
    if (!this.stateAddress) throw new Error("Client not initialized");

    const metadata = this.getMetadataAddress(mint);
    const masterEdition = this.getMasterEditionAddress(mint);
    const offsetMetadata = this.getOffsetMetadataAddress(mint);
    const offsetTiers = this.getOffsetTiersAddress(this.stateAddress);
    const userTokenAccount = getAssociatedTokenAddressSync(mint, user, true);

    return {
      program: PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      metadata,
      userTokenAccount,
      masterEdition,
      offsetMetadata,
      offsetTiers,
    };
  }
}
