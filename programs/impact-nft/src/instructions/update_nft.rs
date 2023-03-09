use crate::error::ErrorCode;
use crate::seeds::{OFFSET_METADATA_SEED, OFFSET_TIERS_SEED, TOKEN_AUTHORITY_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
use crate::utils::metaplex::{
    check_metadata_account, unverify_nft, update_metadata, verify_nft
};
use anchor_lang::prelude::*;
use anchor_spl::token::{ Mint, Token, TokenAccount };

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
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    // todo: Move to instruction?
    #[account(address = new_collection(&offset_tiers, offset_amount))]
    /// CHECK: Checked by offsetTiers state
    pub new_collection_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to Metaplex
    pub new_collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to Metaplex
    pub new_collection_master_edition: UncheckedAccount<'info>,

    #[account(address = current_collection(&offset_metadata, &offset_tiers))]
    /// CHECK: Checked by offsetTiers state
    pub collection_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to Metaplex
    pub collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to Metaplex
    pub collection_master_edition: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    #[account(address = mpl_token_metadata::ID)]
    /// CHECK: Verified program address
    pub token_metadata_program: UncheckedAccount<'info>,
}

// Todo: Run a check to see if this is needed by attempting to unverify from a
// collection the nft isn't part of
fn current_collection<'a>(
    offset_metadata: &Account<'a, OffsetMetadata>,
    offset_tiers: &Account<'a, OffsetTiers>,
) -> Pubkey {
    let index = offset_metadata.current_level_index;
    offset_tiers.levels[index as usize].collection_mint
}

fn new_collection(
    offset_tiers: &Account<'_, OffsetTiers>, 
    offset_amount: u64
) -> Pubkey {
    offset_tiers
        .get_level(offset_amount)
        .unwrap()
        .collection_mint
}

/** TODO: review edge cases */
pub fn update_nft_handler(ctx: Context<UpdateNft>, offset_amount: u64) -> Result<()> {
    let offset_metadata = &mut ctx.accounts.offset_metadata;
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    let metadata = &ctx.accounts.metadata;

    let token_authority = &ctx.accounts.token_authority;
    let global_state = &ctx.accounts.global_state;
    let token_authority_bump = *ctx.bumps.get("token_authority").unwrap();

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
            &ctx.accounts.metadata,
            &ctx.accounts.payer,
            &ctx.accounts.collection_mint,
            &ctx.accounts.collection_metadata,
            &ctx.accounts.collection_master_edition,
            &global_state.key(),
            token_authority,
            token_authority_bump,
        )?;
        msg!("Updating...");
        update_metadata(
            new_level,
            &metadata.to_account_info(),
            &ctx.accounts.token_metadata_program,
            &global_state.key(),
            &ctx.accounts.token_authority,
            token_authority_bump,
        )?;
        msg!("Verifying...");
        verify_nft(
            &ctx.accounts.metadata,
            &ctx.accounts.payer,
            &ctx.accounts.new_collection_mint,
            &ctx.accounts.new_collection_metadata,
            &ctx.accounts.new_collection_master_edition,
            &global_state.key(),
            token_authority,
            token_authority_bump,
        )?;
    } else {
        return Err(ErrorCode::InvalidUpdateForMint.into());
    }

    Ok(())
}
