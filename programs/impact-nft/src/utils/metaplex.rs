use anchor_lang::prelude::*;

use crate::mpl_token_metadata::types::{Collection, Creator, DataV2};
use crate::mpl_token_metadata::types::{CreateMetadataAccountArgsV3, CreateMasterEditionArgs, UpdateMetadataAccountArgsV2};
use crate::mpl_token_metadata::cpi::{create_master_edition, create_metadata_account_v3, unverify_sized_collection_item, update_metadata_account_v2, verify_sized_collection_item};
use crate::mpl_token_metadata::cpi::accounts::{
    CreateMetadataAccountV3,
    UnverifySizedCollectionItem,
    VerifySizedCollectionItem,
    CreateMasterEdition,
    UpdateMetadataAccountV2,
};
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

    let token_auth_seeds = &[
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new_with_signer(
        token_metadata_program,
        CreateMetadataAccountV3 {
            metadata: metadata_account,
            mint,
            mint_authority: token_authority.clone(),
            payer,
            update_authority: token_authority.clone(),
            system_program,
            rent,
        },
        &[token_auth_seeds],
    );
    create_metadata_account_v3(
        cpi_ctx,
        CreateMetadataAccountArgsV3 {
            data: DataV2 {
                name: level.name.clone(),
                symbol: level.symbol.clone(),
                uri: level.uri.clone(),
                seller_fee_basis_points: 0,
                creators: Some(creator),
                collection: Some(collection),
                uses: None,
            },
            is_mutable: false,
            collection_details: None,
        },
    )?;

    Ok(())
}

pub fn unverify_nft<'a>(
    unverified_metadata: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    collection_mint: AccountInfo<'a>,
    collection_metadata: AccountInfo<'a>,
    collection_master_edition: AccountInfo<'a>,
    collection_authority_record: AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: AccountInfo<'a>,
    token_authority_bump: u8,
    token_metadata_program: AccountInfo<'a>,
) -> Result<()> {
    let token_auth_seeds = &[
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new_with_signer(
        token_metadata_program,
        UnverifySizedCollectionItem {
            metadata: unverified_metadata,
            collection_authority: token_authority,
            payer,
            collection_mint,
            collection: collection_metadata,
            collection_master_edition_account: collection_master_edition,
            collection_authority_record,
        },
        &[token_auth_seeds],
    );
    unverify_sized_collection_item(
        cpi_ctx,
    )?;

    Ok(())
}

pub fn verify_nft<'a>(
    unverified_metadata: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    collection_mint: AccountInfo<'a>,
    collection_metadata: AccountInfo<'a>,
    collection_master_edition: AccountInfo<'a>,
    collection_authority_record: AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: AccountInfo<'a>,
    token_authority_bump: u8,
    token_metadata_program: AccountInfo<'a>,
) -> Result<()> {
    let token_auth_seeds = &[
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new_with_signer(
        token_metadata_program,
        VerifySizedCollectionItem {
            metadata: unverified_metadata,
            collection_authority: token_authority,
            payer,
            collection_mint,
            collection: collection_metadata,
            collection_master_edition_account: collection_master_edition,
            collection_authority_record,
        },
        &[token_auth_seeds],
    );
    verify_sized_collection_item(
        cpi_ctx,
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
    let token_auth_seeds = &[
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new_with_signer(
        token_metadata_program,
        CreateMasterEdition {
            edition: master_edition,
            mint,
            update_authority: token_authority.clone(),
            mint_authority: token_authority.clone(),
            payer,
            metadata,
            token_program,
            system_program,
            rent,
        },
        &[token_auth_seeds],
    );
    create_master_edition(
        cpi_ctx,
        CreateMasterEditionArgs {
            max_supply: Some(0),
        },
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

    let token_auth_seeds = &[
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    let cpi_ctx = CpiContext::new_with_signer(
        token_metadata_program,
        UpdateMetadataAccountV2 {
            metadata,
            update_authority: token_authority.clone(),
        },
        &[token_auth_seeds],
    );
    update_metadata_account_v2(
        cpi_ctx,
        UpdateMetadataAccountArgsV2 {
            data: Some(new_data),
            update_authority: Some(token_authority.key()),
            primary_sale_happened: None,
            is_mutable: None,
        },
    )?;

    Ok(())
}