use crate::error::ErrorCode;
use crate::state::{GlobalState, GlobalStateUpdateInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: GlobalStateUpdateInput)]
pub struct UpdateGlobalState<'info> {
    pub admin_authority: Signer<'info>,
    #[account(
        mut,
        has_one = admin_authority @ ErrorCode::InvalidAdminAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
}

pub fn update_global_state_handler(
    ctx: Context<UpdateGlobalState>,
    state: GlobalStateUpdateInput,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.admin_authority = state.admin_authority.key();
    global_state.mint_authority = state.mint_authority.key();
    global_state.levels = state.levels;
    Ok(())
}
