use crate::seeds::OFFSET_TIERS_SEED;
use crate::state::{GlobalState, OffsetTiers, OffsetTiersInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: OffsetTiersInput)]
pub struct CreateOffsetTiers<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        init,
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
        payer = payer,
        space = OffsetTiers::SPACE,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    pub system_program: Program<'info, System>,
}

pub fn create_offset_tiers_handler(
    ctx: Context<CreateOffsetTiers>,
    state: OffsetTiersInput,
) -> Result<()> {
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    offset_tiers.set(state);
    Ok(())
}
