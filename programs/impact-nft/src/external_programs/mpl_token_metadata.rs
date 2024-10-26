use anchor_lang::prelude::Pubkey;
use anchor_spl::metadata::mpl_token_metadata::programs::MPL_TOKEN_METADATA_ID;

#[derive(Clone)]
pub struct MplTokenMetadata;

impl anchor_lang::Id for MplTokenMetadata {
    fn id() -> Pubkey {
        MPL_TOKEN_METADATA_ID
    }
}
