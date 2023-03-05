use crate::error::ErrorCode;
use crate::seeds::OFFSET_TIERS_SEED;
use crate::state::{GlobalState, OffsetTiers, OffsetTiersInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: OffsetTiersInput)]
pub struct UpdateOffsetTiers<'info> {
    pub admin_authority: Signer<'info>,
    #[account(
        has_one = admin_authority @ ErrorCode::InvalidAdminAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
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
