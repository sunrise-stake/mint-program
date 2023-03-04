use crate::state::OffsetMetadata;
use anchor_lang::{prelude::*, Discriminator};

// TODO: Double check if crate::ID is a correct owner of all things, or if we should use a PDA
pub fn set_offset_metadata<'a>(
    offset_metadata: &AccountInfo<'a>,
    offset_amount: u64,
    offset_metadata_bump: u8,
) -> Result<()> {
    require_keys_eq!(*offset_metadata.owner, crate::ID);
    {
        let discriminator = OffsetMetadata::discriminator();
        let expected_discriminator = &discriminator[..];
        let maybe_discriminator = &offset_metadata.data.borrow()[..8];
        assert!(expected_discriminator == maybe_discriminator);
    }

    /* set offset metadata */
    let mut owned_offset_metadata = Account::<'a, OffsetMetadata>::try_from(offset_metadata)?;
    owned_offset_metadata.set(
        offset_amount,
        offset_metadata_bump,
    );

    // Serialize changes back into account, skipping the space allocated to discriminator
    owned_offset_metadata.serialize(&mut &mut offset_metadata.data.borrow_mut()[8..])?;
    Ok(())
}
