use crate::seeds::TOKEN_AUTHORITY_SEED;
use crate::state::{GlobalState, GlobalStateCreateInput};
use anchor_lang::prelude::*;

#[derive(Accounts, Clone)]
#[instruction(state: GlobalStateCreateInput)]
pub struct CreateGlobalState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub admin_update_authority: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = GlobalState::SPACE,
    )]
    pub global_state: Account<'info, GlobalState>,
    /// The account Metaplex recognizes as the update_authority for
    /// the tokens. Any instruction that uses it still requires at least
    /// one of the EOA and PDA authorities for checking validity, but it
    /// can be used with either
    #[account(
        seeds = [TOKEN_AUTHORITY_SEED, global_state.key().as_ref()],
        bump
    )]
    pub token_authority: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_global_state_handler(
    ctx: Context<CreateGlobalState>,
    state: GlobalStateCreateInput,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.set(
        ctx.accounts.admin_update_authority.key(),
        state.admin_mint_authority,
        state.levels,
    );
    Ok(())
}
