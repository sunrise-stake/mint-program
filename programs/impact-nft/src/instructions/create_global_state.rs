use crate::seeds::GLOBAL_STATE_SEED;
use crate::state::{GlobalState, GlobalStateInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: GlobalStateInput)]
pub struct CreateGlobalState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        seeds = [GLOBAL_STATE_SEED, state.authority.as_ref()],
        bump,
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
        *ctx.bumps.get("global_state").unwrap(),
    );
    Ok(())
}
