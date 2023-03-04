use crate::state::{GlobalState, GlobalStateCreateInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: GlobalStateCreateInput)]
pub struct CreateGlobalState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub admin_authority: Signer<'info>,
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
    state: GlobalStateCreateInput,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.set(
        ctx.accounts.admin_authority.key(),
        state.mint_authority,
        state.levels,
    );
    Ok(())
}
