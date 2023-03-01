import { AnchorProvider, Program } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import { ImpactNft, IDL } from "../types/impact_nft";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const PROGRAM_ID = new PublicKey(
  "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc"
);

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

    this.stateAddress = stateAddress
  }

  public static getGlobalStateAddress(authority: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("global_state"), authority.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  /** Create NFT ix */
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
}
