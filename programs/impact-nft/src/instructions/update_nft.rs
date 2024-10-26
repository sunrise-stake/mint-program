use crate::error::ErrorCode;
use crate::seeds::{OFFSET_METADATA_SEED, OFFSET_TIERS_SEED, TOKEN_AUTHORITY_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
use crate::utils::metaplex::{check_metadata_account, unverify_nft, update_metadata, verify_nft};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use crate::external_programs::mpl_token_metadata::MplTokenMetadata;

/// Permissionless. Requires the external admin_mint_authority
#[derive(Accounts)]
#[instruction(offset_amount: u64)]
pub struct UpdateNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    // needed for verify ix
    pub admin_mint_authority: Signer<'info>,
    /// CHECK: Verified with function
    #[account(
        seeds = [TOKEN_AUTHORITY_SEED, global_state.key().as_ref()],
        bump
    )]
    pub token_authority: UncheckedAccount<'info>,

    #[account(
        has_one = admin_mint_authority @ ErrorCode::InvalidMintAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    #[account(
        mut,
        seeds = [OFFSET_METADATA_SEED, mint.key().as_ref(), global_state.key().as_ref()],
        bump,
    )]
    pub offset_metadata: Account<'info, OffsetMetadata>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,
    /// CHECK: Verified with the check_metadata_account helper function
    #[account(
        mut,
        constraint = check_metadata_account(&metadata, &mint.to_account_info()),
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Checked by instruction
    pub new_collection_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to Metaplex
    pub new_collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to Metaplex
    pub new_collection_master_edition: UncheckedAccount<'info>,

    /// CHECK: Checked by instruction
    pub collection_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to Metaplex
    pub collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to Metaplex
    pub collection_master_edition: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to Metaplex
    pub collection_authority_record: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, MplTokenMetadata>,
}

// Todo: Run a check to see if this is needed by attempting to unverify from a
// collection the nft isn't part of
fn calculate_current_collection_key<'a>(
    offset_metadata: &Account<'a, OffsetMetadata>,
    offset_tiers: &Account<'a, OffsetTiers>,
) -> Pubkey {
    let index = offset_metadata.current_level_index;
    offset_tiers.levels[index as usize].collection_mint
}

fn calculate_new_collection_key(offset_tiers: &Account<'_, OffsetTiers>, offset_amount: u64) -> Pubkey {
    offset_tiers
        .get_level(offset_amount)
        .unwrap()
        .collection_mint
}

/** TODO: review edge cases */
pub fn update_nft_handler(ctx: Context<UpdateNft>, offset_amount: u64) -> Result<()> {
    let offset_metadata = &mut ctx.accounts.offset_metadata;
    let offset_tiers = &ctx.accounts.offset_tiers;
    let metadata = &ctx.accounts.metadata;

    let current_collection_key = calculate_current_collection_key(offset_metadata, offset_tiers);
    let new_collection_key = calculate_new_collection_key(offset_tiers, offset_amount);
    require_keys_eq!(*ctx.accounts.collection_mint.key, current_collection_key);
    require_keys_eq!(*ctx.accounts.new_collection_mint.key, new_collection_key);

    let token_authority = &ctx.accounts.token_authority;
    let global_state = &ctx.accounts.global_state;
    let token_authority_bump = ctx.bumps.token_authority;

    // TODO: check that offset_tiers.levels.len() > 0
    if offset_tiers.levels.is_empty() {
        return Err(ErrorCode::NoOffsetTiers.into());
    }

    let new_level_index = offset_tiers
        .get_index_from_offset(offset_amount)
        .unwrap_or(0);
    if new_level_index == offset_metadata.current_level_index as usize {
        // no need to update
        return Ok(());
    }
    let new_level = &offset_tiers.levels[new_level_index];

    if **ctx.accounts.mint.to_account_info().try_borrow_lamports()? > 0 {
        offset_metadata.set_amount(offset_amount);
        offset_metadata.set_level_index(new_level_index);

        msg!("Unverifying...");
        unverify_nft(
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.collection_metadata.to_account_info(),
            ctx.accounts.collection_master_edition.to_account_info(),
            &global_state.key(),
            token_authority.to_account_info(),
            token_authority_bump,
            ctx.accounts.token_metadata_program.to_account_info(),
        )?;
        msg!("Updating...");
        update_metadata(
            new_level,
            metadata.to_account_info(),
            &global_state.key(),
            ctx.accounts.token_authority.to_account_info(),
            token_authority_bump,
            ctx.accounts.token_metadata_program.to_account_info(),
        )?;
        msg!("Verifying...");
        verify_nft(
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.new_collection_mint.to_account_info(),
            ctx.accounts.new_collection_metadata.to_account_info(),
            ctx.accounts.new_collection_master_edition.to_account_info(),
            &global_state.key(),
            token_authority.to_account_info(),
            token_authority_bump,
            ctx.accounts.token_metadata_program.to_account_info(),
        )?;
    } else {
        return Err(ErrorCode::InvalidUpdateForMint.into());
    }

    Ok(())
}
