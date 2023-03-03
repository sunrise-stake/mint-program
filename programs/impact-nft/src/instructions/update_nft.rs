use crate::error::ErrorCode;
use crate::seeds::{OFFSET_METADATA_SEED, OFFSET_TIERS_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
use crate::utils::metaplex::set_metadata_uri;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct UpdateNft<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    /// CHECK: Checked in metaplex program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = authority @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    #[account(
        mut,
        seeds = [OFFSET_METADATA_SEED, mint.key().as_ref()],
        bump,
        has_one = authority @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub offset_metadata: Account<'info, OffsetMetadata>,
}

/** TODO: review edge cases */
pub fn update_nft_handler(ctx: Context<UpdateNft>, offset_amount: u64) -> Result<()> {
    let mint = &ctx.accounts.mint;
    let mint_authority = &ctx.accounts.authority;
    let offset_metadata = &mut ctx.accounts.offset_metadata;
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    let metadata = &mut ctx.accounts.metadata;

    // TODO: check that offset_tiers.levels.len() > 0
    if offset_tiers.levels.is_empty() {
        return Err(ErrorCode::NoOffsetTiers.into());
    }

    if **ctx.accounts.mint.to_account_info().try_borrow_lamports()? > 0 {
        offset_metadata.set(
            mint_authority.key(),
            mint.key(),
            offset_amount,
            *ctx.bumps.get("offset_metadata").unwrap(),
        );
        set_metadata_uri(offset_tiers, &metadata.to_account_info(), offset_amount)?;
    } else {
        return Err(ErrorCode::InvalidUpdateForMint.into());
    }

    Ok(())
}
