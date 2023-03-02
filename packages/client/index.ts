import { AnchorProvider, Program } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";
import { ImpactNft, IDL } from "../types/impact_nft";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const PROGRAM_ID = new PublicKey(
  "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc"
);

interface levels {
  offset: anchor.BN;
  uri: string;
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

  constructor(readonly provider: AnchorProvider) {
    this.program = new Program<ImpactNft>(IDL, PROGRAM_ID, provider);
  }

  private async init(stateAddress: PublicKey): Promise<void> {
    const state = await this.program.account.globalState.fetch(stateAddress);

    this.config = {
      authority: state.authority,
      levels: state.levels as number,
    };

    this.stateAddress = stateAddress;
  }

  public static getGlobalStateAddress(authority: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("global_state"), authority.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  public static getOffsetTiersAddress(authority: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("offset_tiers"), authority.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  public static getOffsetMetadataAddress(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("offset_metadata"), mint.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  /** get metadata account... can't find an easy way to do this via their sdk */
  public static getMetadataAddress(mint: PublicKey): PublicKey {
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
  public static getMasterEditionAddress(mint: PublicKey): PublicKey {
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

  public static async register(
    authority: PublicKey,
    levels: number
  ): Promise<ImpactNftClient> {
    const state = this.getGlobalStateAddress(authority);

    const client = new ImpactNftClient(setUpAnchor());

    const accounts = {
      authority: client.provider.publicKey,
      globalState: state,
      systemProgram: SystemProgram.programId,
    };

    await client.program.methods
      .createGlobalState({
        authority,
        levels,
      })
      .accounts(accounts)
      .rpc()
      .then(() => confirm(client.provider.connection));

    await client.init(state);

    return client;
  }

  public static async registerOffsetTiers(
    authority: PublicKey,
    levels: levels[]
  ): Promise<ImpactNftClient> {
    // get state account
    const globalState = this.getGlobalStateAddress(authority);
    const offsetTiers = this.getOffsetTiersAddress(authority);

    const client = new ImpactNftClient(setUpAnchor());

    await client.program.methods
      .createOffsetTiers({
        authority,
        levels,
      })
      .accounts({
        authority: client.provider.publicKey,
        globalState,
        offsetTiers,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
      .then(() => confirm(client.provider.connection));

    await client.init(globalState);
    return client;
  }

  public static async getMintNftAccounts(
    authority: PublicKey,
    holder: PublicKey
  ): Promise<{
    PROGRAM_ID: PublicKey;
    globalState: PublicKey;
    TOKEN_METADATA_PROGRAM_ID: PublicKey;
    mint: Keypair;
    metadata: PublicKey;
    userTokenAccount: PublicKey;
    masterEdition: PublicKey;
    offsetMetadata: PublicKey;
    offsetTiers: PublicKey;
  }> {
    // not sure if this should go here or the main sdk
    const mint = Keypair.generate();
    const metadata = this.getMetadataAddress(mint.publicKey);
    const masterEdition = this.getMasterEditionAddress(mint.publicKey);
    const offsetMetadata = this.getOffsetMetadataAddress(mint.publicKey);

    const globalState = this.getGlobalStateAddress(authority);
    const offsetTiers = this.getOffsetTiersAddress(authority);

    const userTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      holder,
      true
    );

    return {
      PROGRAM_ID,
      globalState,
      TOKEN_METADATA_PROGRAM_ID,
      mint,
      metadata,
      userTokenAccount,
      masterEdition,
      offsetMetadata,
      offsetTiers,
    };
  }
}
