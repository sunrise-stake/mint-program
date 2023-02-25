use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use mpl_token_metadata::instruction::{create_master_edition_v3, create_metadata_accounts_v3};

pub fn create_metadata_account<'a>(
    name: String,
    symbol: String,
    uri: String,
    metadata_account: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    mint_authority: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    update_authority: &AccountInfo<'a>,
    token_metadata_program: &AccountInfo<'a>,
    system_program: &Program<'a, System>,
    rent: &AccountInfo<'a>,
) -> Result<()> {
    let accounts = vec![
        metadata_account.clone(),
        mint.clone(),
        mint_authority.clone(),
        payer.clone(),
        update_authority.clone(),
        system_program.to_account_info().clone(),
        rent.clone(),
    ];

    let creator = vec![
        mpl_token_metadata::state::Creator {
            address: payer.key(),
            verified: false,
            share: 100,
        },
        mpl_token_metadata::state::Creator {
            address: mint_authority.key(),
            verified: false,
            share: 0,
        },
    ];

    invoke(
        &create_metadata_accounts_v3(
            token_metadata_program.key(),
            metadata_account.key(),
            mint.key(),
            mint_authority.key(),
            payer.key(),
            payer.key(),
            name,
            symbol,
            uri,
            Some(creator),
            1,
            true,
            false,
            None,
            None,
            None,
        ),
        accounts.as_slice(),
    )?;

    Ok(())
}

pub fn create_master_edition_account<'a>(
    update_authority: &AccountInfo<'a>,
    master_edition: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    mint_authority: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    metadata: &AccountInfo<'a>,
    token_metadata_program: &AccountInfo<'a>,
    system_program: &Program<'a, System>,
    rent: &AccountInfo<'a>,
) -> Result<()> {
    let accounts = vec![
        master_edition.clone(),
        mint.clone(),
        mint_authority.clone(),
        payer.clone(),
        metadata.clone(),
        system_program.to_account_info().clone(),
        rent.clone(),
    ];

    invoke(
        &create_master_edition_v3(
            token_metadata_program.key(),
            master_edition.key(),
            mint.key(),
            update_authority.key(),
            mint_authority.key(),
            metadata.key(),
            payer.key(),
            Some(0),
        ),
        accounts.as_slice(),
    )?;

    Ok(())
}
