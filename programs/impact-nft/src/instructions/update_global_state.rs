use crate::error::ErrorCode;
use crate::state::{GlobalState, GlobalStateUpdateInput};
use anchor_lang::prelude::*;

/// Permissioned. Requires the admin_update_authority
#[derive(Accounts, Clone)]
#[instruction(state: GlobalStateUpdateInput)]
pub struct UpdateGlobalState<'info> {
    pub admin_update_authority: Signer<'info>,
    #[account(
        mut,
        has_one = admin_update_authority @ ErrorCode::InvalidAdminAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
}

pub fn update_global_state_handler(
    ctx: Context<UpdateGlobalState>,
    state: GlobalStateUpdateInput,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.admin_update_authority = state.admin_update_authority.key();
    global_state.admin_mint_authority = state.admin_mint_authority.key();
    global_state.levels = state.levels;
    Ok(())
}
