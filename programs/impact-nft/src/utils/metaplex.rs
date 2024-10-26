use anchor_lang::prelude::*;

use anchor_spl::metadata::mpl_token_metadata::types::{Collection, Creator, DataV2};
use anchor_spl::metadata::{CreateMetadataAccountsV3, UnverifySizedCollectionItem, VerifySizedCollectionItem, CreateMasterEditionV3, create_metadata_accounts_v3, update_metadata_accounts_v2, unverify_sized_collection_item, verify_sized_collection_item, create_master_edition_v3, UpdateMetadataAccountsV2};
use anchor_spl::metadata::mpl_token_metadata::accounts::Metadata;
use crate::seeds::TOKEN_AUTHORITY_SEED;
use crate::Level;

pub fn create_metadata_account<'a>(
    level: &Level,
    metadata_account: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: AccountInfo<'a>,
    token_authority_bump: u8,
    token_metadata_program: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    rent: AccountInfo<'a>,
) -> Result<()> {
    let creator = vec![Creator {
        address: token_authority.key(),
        verified: true,
        share: 100,
    }];
    let collection = Collection {
        verified: false,
        key: level.collection_mint,
    };

    let seeds = [
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new(
        token_metadata_program,
        CreateMetadataAccountsV3 {
            metadata: metadata_account,
            mint,
            mint_authority: token_authority.clone(),
            payer,
            update_authority: token_authority.clone(),
            system_program,
            rent,
        }
    );
    create_metadata_accounts_v3(
        cpi_ctx.with_signer(&[&seeds]),
        DataV2 {
            name: level.name.clone(),
            symbol: level.symbol.clone(),
            uri: level.uri.clone(),
            seller_fee_basis_points: 0,
            creators: Some(creator),
            collection: Some(collection),
            uses: None,
        },
        false,
        false,
        None,
    )?;

    Ok(())
}

pub fn unverify_nft<'a>(
    unverified_metadata: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    collection_mint: AccountInfo<'a>,
    collection_metadata: AccountInfo<'a>,
    collection_master_edition: AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: AccountInfo<'a>,
    token_authority_bump: u8,
    token_metadata_program: AccountInfo<'a>,
) -> Result<()> {
    let seeds = [
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new(
        token_metadata_program,
        UnverifySizedCollectionItem {
            metadata: unverified_metadata,
            collection_authority: token_authority,
            payer,
            collection_mint,
            collection: collection_metadata,
            collection_master_edition_account: collection_master_edition,
        }
    );
    unverify_sized_collection_item(
        cpi_ctx.with_signer(&[&seeds]),
        None
    )?;

    Ok(())
}

pub fn verify_nft<'a>(
    unverified_metadata: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    collection_mint: AccountInfo<'a>,
    collection_metadata: AccountInfo<'a>,
    collection_master_edition: AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: AccountInfo<'a>,
    token_authority_bump: u8,
    token_metadata_program: AccountInfo<'a>,
) -> Result<()> {
    let seeds = [
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new(
        token_metadata_program,
        VerifySizedCollectionItem {
            metadata: unverified_metadata,
            collection_authority: token_authority,
            payer,
            collection_mint,
            collection_metadata,
            collection_master_edition,
        },
    );
    verify_sized_collection_item(
        cpi_ctx.with_signer(&[&seeds]),
        None
    )?;

    Ok(())
}

pub fn create_master_edition_account<'a>(
    master_edition: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    metadata: AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: AccountInfo<'a>,
    token_authority_bump: u8,
    token_metadata_program: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    rent: AccountInfo<'a>,
) -> Result<()> {
    let seeds = [
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new(
        token_metadata_program,
        CreateMasterEditionV3 {
            edition: master_edition,
            mint,
            update_authority: token_authority.clone(),
            mint_authority: token_authority.clone(),
            payer,
            metadata,
            token_program,
            system_program,
            rent,
        }
    );
    create_master_edition_v3(
        cpi_ctx.with_signer(&[&seeds]),
        Some(0)
    )?;

    Ok(())
}

pub fn update_metadata<'a>(
    new_level: &Level,
    metadata: AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: AccountInfo<'a>,
    token_authority_bump: u8,
    token_metadata_program: AccountInfo<'a>,
) -> Result<()> {
    let creator = vec![Creator {
        address: token_authority.key(),
        verified: true,
        share: 100,
    }];

    let new_collection = Collection {
        verified: false,
        key: new_level.collection_mint,
    };

    let new_data = DataV2 {
        name: new_level.name.clone(),
        symbol: new_level.symbol.clone(),
        uri: new_level.uri.clone(),
        seller_fee_basis_points: 0,
        creators: Some(creator),
        collection: Some(new_collection),
        uses: None,
    };

    let seeds = [
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new(
        token_metadata_program,
        UpdateMetadataAccountsV2 {
            metadata: metadata.to_account_info(),
            update_authority: token_authority.to_account_info(),
        },
    );
    update_metadata_accounts_v2(
        cpi_ctx.with_signer(&[&seeds]),
        Some(token_authority.key()),
        Some(new_data),
        None,
        None
    )?;

    Ok(())
}

/// Helper function that affirms that the metadata originates
/// from this program instance. It does this by comparison with
/// the mint which itself is validated by its unique offset_metadata
pub fn check_metadata_account<'a>(metadata: &AccountInfo<'a>, mint: &AccountInfo<'a>) -> bool {
    let state: Metadata =
        Metadata::try_from(&metadata.to_account_info()).unwrap();

    mint.key() == state.mint
}
