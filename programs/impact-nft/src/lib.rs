#![allow(clippy::result_large_err)]
#![allow(clippy::too_many_arguments)]
use anchor_lang::prelude::*;

declare_id!("SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc");

pub mod state;
use state::*;

pub mod error;
pub mod seeds;
pub mod utils;

pub mod instructions;
mod external_programs;

use instructions::*;

#[program]
pub mod impact_nft {
    use super::*;

    pub fn create_global_state(
        ctx: Context<CreateGlobalState>,
        input: GlobalStateCreateInput,
    ) -> Result<()> {
        create_global_state_handler(ctx, input)
    }

    pub fn update_global_state(
        ctx: Context<UpdateGlobalState>,
        input: GlobalStateUpdateInput,
    ) -> Result<()> {
        update_global_state_handler(ctx, input)
    }

    pub fn create_offset_tiers(
        ctx: Context<CreateOffsetTiers>,
        input: OffsetTiersInput,
    ) -> Result<()> {
        create_offset_tiers_handler(ctx, input)
    }

    pub fn update_offset_tiers(
        ctx: Context<UpdateOffsetTiers>,
        input: OffsetTiersInput,
    ) -> Result<()> {
        update_offset_tiers_handler(ctx, input)
    }

    pub fn add_levels(ctx: Context<AddLevels>, input: Vec<Level>) -> Result<()> {
        add_level_handler(ctx, input)
    }

    pub fn mint_nft(ctx: Context<MintNft>, offset_amount: u64, principal: u64) -> Result<()> {
        mint_nft_handler(ctx, offset_amount, principal)
    }

    pub fn update_nft(ctx: Context<UpdateNft>, offset_amount: u64) -> Result<()> {
        update_nft_handler(ctx, offset_amount)
    }
}
