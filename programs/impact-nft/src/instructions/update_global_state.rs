use crate::seeds::GLOBAL_STATE_SEED;
use crate::state::{GlobalState, GlobalStateInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: GlobalStateInput)]
pub struct UpdateGlobalState<'info> {
    #[account(
        mut
        constraint = authority.key() == global_state.authority @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub authority: Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_SEED, global_state.authority.as_ref()],
        bump,
        payer = authority,
        space = GlobalState::SPACE,
    )]
    pub global_state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

pub fn update_global_state_handler(
    ctx: Context<CreateGlobalState>,
    state: GlobalStateInput,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state.to_account_info();
    global_state.authority = state.authority.key();
    global_state.levels = state.levels;
    Ok(())
}
