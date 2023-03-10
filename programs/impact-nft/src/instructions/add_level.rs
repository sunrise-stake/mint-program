use crate::error::ErrorCode;
use crate::seeds::OFFSET_TIERS_SEED;
use crate::state::{GlobalState, Level, OffsetTiers};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddLevels<'info> {
    pub admin_update_authority: Signer<'info>,
    #[account(
        has_one = admin_update_authority @ ErrorCode::InvalidAdminAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
}

pub fn add_level_handler(ctx: Context<AddLevels>, incoming: Vec<Level>) -> Result<()> {
    let current = &mut ctx.accounts.offset_tiers.levels;
    let initial_length = current.len();

    msg!("{} incoming levels", incoming.len());

    for level in incoming {
        if current.len() == OffsetTiers::MAX_LEVELS {
            break;
        }
        current.push(level);
    }
    msg!(
        "Added {} new levels to offsetTiers",
        current.len() - initial_length
    );

    Ok(())
}
