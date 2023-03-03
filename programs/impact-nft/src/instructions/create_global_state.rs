use crate::state::{GlobalState, GlobalStateInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: GlobalStateInput)]
pub struct CreateGlobalState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = GlobalState::SPACE,
    )]
    pub global_state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

pub fn create_global_state_handler(
    ctx: Context<CreateGlobalState>,
    state: GlobalStateInput,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.set(
        state.authority,
        state.levels,
    );
    Ok(())
}
