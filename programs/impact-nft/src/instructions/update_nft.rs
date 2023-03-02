use crate::error::ErrorCode;
use crate::seeds::{GLOBAL_STATE_SEED, OFFSET_METADATA_SEED, OFFSET_TIERS_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
use crate::utils::metaplex::set_metadata_uri;
use crate::utils::offset::set_offset_metadata;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct UpdateNFT<'info> {
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    /// CHECK: Checked in metaplex program
    #[account(mut)]
    /// CHECK: Checked by metaplex (TODO ?)
    pub metadata: UncheckedAccount<'info>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED, mint_authority.key().as_ref()],
        bump = global_state.bump,
        constraint = global_state.authority == mint_authority.key() @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [OFFSET_TIERS_SEED, mint_authority.key().as_ref()],
        bump = offset_tiers.bump,
        constraint = offset_tiers.authority == mint_authority.key() @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    #[account(
        mut,
        seeds = [OFFSET_METADATA_SEED, mint.key().as_ref()],
        bump = offset_metadata.bump,
        constraint = offset_metadata.authority == mint_authority.key() @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub offset_metadata: Account<'info, OffsetMetadata>,
}

/** TODO: review edge cases */
pub fn update_nft_handler(ctx: Context<UpdateNFT>, offset_amount: u64) -> Result<()> {
    let mint = &ctx.accounts.mint;
    let mint_authority = &ctx.accounts.mint_authority;
    let offset_metadata = &ctx.accounts.offset_metadata;
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    let metadata = &mut ctx.accounts.metadata;

    // TODO: check that offset_tiers.levels.len() > 0
    if offset_tiers.levels.is_empty() {
        return Err(ErrorCode::NoOffsetTiers.into());
    }

    if **ctx.accounts.mint.to_account_info().try_borrow_lamports()? > 0 {
        set_offset_metadata(
            &mint.to_account_info(),
            &mint_authority.to_account_info(),
            offset_metadata,
            offset_amount,
        )?;
        set_metadata_uri(offset_tiers, &metadata.to_account_info(), offset_amount)?;
    } else {
        return Err(ErrorCode::InvalidUpdateForMint.into());
    }

    Ok(())
}
