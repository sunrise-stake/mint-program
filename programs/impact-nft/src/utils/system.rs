use crate::seeds::OFFSET_METADATA_SEED;
use crate::state::OffsetMetadata;
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::Discriminator;

pub fn create_offset_metadata_account<'a>(
    program_id: &Pubkey,
    global_state: Pubkey,
    payer: AccountInfo<'a>,
    mint: Pubkey,
    pda: AccountInfo<'a>,
    system: &Program<'a, System>,
    bump: u8,
) -> Result<()> {
    let rent = Rent::get()?;
    let offset_metadata_lamports = rent.minimum_balance(OffsetMetadata::SPACE);

    let account = solana_program::system_instruction::create_account(
        &payer.key(),
        &pda.key(),
        offset_metadata_lamports,
        OffsetMetadata::SPACE as u64,
        program_id,
    );

    let seed = &[
        OFFSET_METADATA_SEED,
        mint.as_ref(),
        global_state.as_ref(),
        &[bump],
    ];

    // Send the system instruction to the runtime for processing
    solana_program::program::invoke_signed(
        &account,
        &[payer, pda.clone(), system.to_account_info()],
        &[&seed[..]],
    )?;

    let discriminator = OffsetMetadata::discriminator();
    discriminator.serialize(&mut &mut pda.data.borrow_mut()[..8])?;
    Ok(())
}
