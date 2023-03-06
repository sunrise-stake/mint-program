use crate::error::ErrorCode;
use crate::seeds::{OFFSET_METADATA_SEED, OFFSET_TIERS_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
use crate::utils::metaplex::set_metadata_uri;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct UpdateNft<'info> {
    pub mint_authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    /// CHECK: Checked in metaplex program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(
        has_one = mint_authority @ ErrorCode::InvalidMintAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    #[account(
        mut,
        seeds = [OFFSET_METADATA_SEED, mint.key().as_ref()],
        bump,
    )]
    pub offset_metadata: Account<'info, OffsetMetadata>,
}

/** TODO: review edge cases */
pub fn update_nft_handler(ctx: Context<UpdateNft>, offset_amount: u64) -> Result<()> {
    let offset_metadata = &mut ctx.accounts.offset_metadata;
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    let metadata = &mut ctx.accounts.metadata;

    // TODO: check that offset_tiers.levels.len() > 0
    if offset_tiers.levels.is_empty() {
        return Err(ErrorCode::NoOffsetTiers.into());
    }

    if **ctx.accounts.mint.to_account_info().try_borrow_lamports()? > 0 {
        offset_metadata.set_amount(offset_amount);
        set_metadata_uri(offset_tiers, &metadata.to_account_info(), offset_amount)?;
    } else {
        return Err(ErrorCode::InvalidUpdateForMint.into());
    }

    Ok(())
}
