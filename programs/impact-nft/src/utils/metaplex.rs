use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use mpl_token_metadata::instruction::{create_master_edition_v3, create_metadata_accounts_v3};
use mpl_token_metadata::state::{DataV2, Metadata, TokenMetadataAccount};

use crate::Level;

pub fn create_metadata_account<'a>(
    level: &Level,
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

    let creator = vec![mpl_token_metadata::state::Creator {
        address: mint_authority.key(),
        verified: true,
        share: 100,
    }];

    let collection = mpl_token_metadata::state::Collection {
        verified: false,
        key: level.collection_mint,
    };

    invoke(
        &create_metadata_accounts_v3(
            token_metadata_program.key(),
            metadata_account.key(),
            mint.key(),
            mint_authority.key(),
            payer.key(),
            mint_authority.key(),
            level.name.clone(),
            level.symbol.clone(),
            level.uri.clone(),
            Some(creator),
            1,
            true,
            true,
            Some(collection),
            None,
            None,
        ),
        accounts.as_slice(),
    )?;

    Ok(())
}

pub fn unverify_nft<'a>(
    mint_authority: &AccountInfo<'a>,
    unverified_metadata: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    collection_mint: &AccountInfo<'a>,
    collection_metadata: &AccountInfo<'a>,
    collection_master_edition: &AccountInfo<'a>,
) -> Result<()> {
    let accounts = [
        unverified_metadata.clone(),
        mint_authority.clone(),
        payer.clone(),
        collection_mint.clone(),
        collection_metadata.clone(),
        collection_master_edition.clone(),
    ];

    invoke(
        &mpl_token_metadata::instruction::unverify_sized_collection_item(
            mpl_token_metadata::ID,
            *unverified_metadata.key,
            *mint_authority.key,
            *payer.key,
            *collection_mint.key,
            *collection_metadata.key,
            *collection_master_edition.key,
            None,
        ),
        &accounts,
    )?;

    Ok(())
}

pub fn verify_nft<'a>(
    mint_authority: &AccountInfo<'a>,
    unverified_metadata: &AccountInfo<'a>,
    payer: &AccountInfo<'a>,
    collection_mint: &AccountInfo<'a>,
    collection_metadata: &AccountInfo<'a>,
    collection_master_edition: &AccountInfo<'a>,
) -> Result<()> {
    let accounts = [
        unverified_metadata.clone(),
        mint_authority.clone(),
        payer.clone(),
        collection_mint.clone(),
        collection_metadata.clone(),
        collection_master_edition.clone(),
    ];

    invoke(
        &mpl_token_metadata::instruction::verify_sized_collection_item(
            mpl_token_metadata::ID,
            *unverified_metadata.key,
            *mint_authority.key,
            *payer.key,
            *collection_mint.key,
            *collection_metadata.key,
            *collection_master_edition.key,
            None,
        ),
        &accounts,
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
    let accounts = [
        update_authority.clone(),
        master_edition.clone(),
        mint.clone(),
        mint_authority.clone(),
        payer.clone(),
        metadata.clone(),
        system_program.to_account_info(),
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
        &accounts,
    )?;

    Ok(())
}

pub fn update_metadata<'a>(
    new_level: &Level,
    metadata: &AccountInfo<'a>,
    mint_authority: &AccountInfo<'a>,
    token_metadata_program: &AccountInfo<'a>,
) -> Result<()> {
    let metadata_state: Metadata =
        TokenMetadataAccount::from_account_info(&metadata.to_account_info())?;
    let initial = metadata_state.data;

    let new_collection = mpl_token_metadata::state::Collection {
        verified: false,
        key: new_level.collection_mint,
    };

    let new_data = DataV2 {
        name: initial.name,
        symbol: initial.symbol,
        uri: new_level.uri.clone(),
        seller_fee_basis_points: initial.seller_fee_basis_points,
        creators: initial.creators,
        collection: Some(new_collection),
        uses: None,
    };

    invoke(
        &mpl_token_metadata::instruction::update_metadata_accounts_v2(
            mpl_token_metadata::ID,
            *metadata.key,
            *mint_authority.key,
            None,
            Some(new_data),
            None,
            None,
        ),
        &[
            token_metadata_program.clone(),
            metadata.clone(),
            mint_authority.clone(),
        ],
    )?;

    Ok(())
}




/// Helper function that affirms that the metadata originates
/// from this program instance. It does this by comparison with
/// the mint which itself is validated by its unique offset_metadata
pub fn check_metadata_account<'a>(metadata: &AccountInfo<'a>, mint: &AccountInfo<'a>) -> bool {
    let state: Metadata =
        TokenMetadataAccount::from_account_info(&metadata.to_account_info()).unwrap();

    mint.key() == state.mint
}
