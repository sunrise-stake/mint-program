use crate::error::ErrorCode;
use crate::seeds::{GLOBAL_STATE_SEED, OFFSET_TIERS_SEED};
use crate::state::{GlobalState, OffsetTiers, OffsetTiersInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: OffsetTiersInput)]
pub struct UpdateOffsetTiers<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED, state.authority.as_ref()],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [OFFSET_TIERS_SEED, state.authority.as_ref()],
        bump,
        constraint = offset_tiers.authority == *authority.key @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
}

pub fn update_offset_tiers_handler(
    ctx: Context<UpdateOffsetTiers>,
    state: OffsetTiersInput,
) -> Result<()> {
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    offset_tiers.set(state);
    Ok(())
}
