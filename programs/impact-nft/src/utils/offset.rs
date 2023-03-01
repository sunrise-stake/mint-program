use crate::state::OffsetMetadata;
use anchor_lang::prelude::*;

// TODO: Double check if crate::ID is a correct owner of all things, or if we should use a PDA
pub fn set_offset_metadata<'a>(
    mint: &AccountInfo<'a>,
    mint_authority: &AccountInfo<'a>,
    offset_metadata: &AccountInfo<'a>,
    offset_amount: u64,
    offset_metadata_bump: u8,
) -> Result<()> {
    // Checked in validator

    /* set offset metadata */
    let mut offset_metadata_owned = Account::<'a, OffsetMetadata>::try_from(offset_metadata)?;
    offset_metadata_owned.set(
        mint_authority.key(),
        mint.key(),
        offset_amount,
        offset_metadata_bump,
    );

    // Serialize changes back into account, skipping the space allocated to discriminator
    offset_metadata_owned.serialize(&mut &mut offset_metadata.data.borrow_mut()[8..])?;
    Ok(())
}
