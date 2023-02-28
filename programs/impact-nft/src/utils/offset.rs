use crate::error::ErrorCode;
use crate::seeds::OFFSET_METADATA_SEED;
use crate::state::OffsetMetadata;
use anchor_lang::prelude::*;

// TODO: Double check if crate::ID is a correct owner of all things, or if we should use a PDA
pub fn set_offset_metadata<'a>(
    mint: &AccountInfo<'a>,
    mint_authority: &AccountInfo<'a>,
    offset_metadata: &Account<'a, OffsetMetadata>,
    offset_amount: u64,
) -> Result<()> {
    let (offset_metadata_pubkey, offset_metadata_bump) =
        Pubkey::find_program_address(&[OFFSET_METADATA_SEED, mint.key().as_ref()], &crate::ID);

    if offset_metadata_pubkey != offset_metadata.key() {
        return Err(ErrorCode::InvalidOffsetMetadata.into());
    }
    /* set offset metadata */
    offset_metadata.clone().set(
        mint_authority.key(),
        mint.key(),
        offset_amount,
        offset_metadata_bump,
    );

    Ok(())
}
