#![allow(clippy::result_large_err)]
#![allow(clippy::too_many_arguments)]
use anchor_lang::prelude::*;

pub mod state;
use state::*;

pub mod error;
pub mod seeds;
pub mod utils;

pub mod instructions;
use instructions::*;

declare_id!("SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc");

#[program]
pub mod impact_nft {
    use super::*;

    pub fn create_global_state(
        ctx: Context<CreateGlobalState>,
        input: GlobalStateInput,
    ) -> Result<()> {
        create_global_state_handler(ctx, input)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
