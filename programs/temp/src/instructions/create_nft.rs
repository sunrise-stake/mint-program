use crate::error::ErrorCode;
use crate::seeds::{GLOBAL_STATE_SEED, OFFSET_TIERS_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
use crate::utils::metaplex::{
    create_master_edition_account, create_metadata_account, set_metadata_uri,
};
use crate::utils::offset::set_offset_metadata;
use crate::utils::system::create_offset_metadata_account;
use crate::utils::token::create_mint;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(
        init_if_needed,
        payer = payer,
        space = Mint::LEN
    )]
    pub mint: Account<'info, Mint>,
    // #[account(mut)]
    pub token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub rent: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED, mint_authority.key().as_ref()],
        bump = global_state.bump,
        constraint = global_state.authority == mint_authority.key() @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [OFFSET_TIERS_SEED, mint_authority.key().as_ref()],
        bump = offset_tiers.bump,
        constraint = offset_tiers.authority == mint_authority.key() @ ErrorCode::InvalidUpdateAuthority,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    /// CHECK: Checked in program
    #[account(mut)]
    pub offset_metadata: Account<'info, OffsetMetadata>,
}

/** TODO: add offset update logic */
pub fn mint_nft(
    ctx: Context<MintNFT>,
    offset_amount: u64,
    name: String,
    symbol: String,
) -> Result<()> {
    let uri = "hello world";
    let mint = &ctx.accounts.mint;
    let mint_authority = &ctx.accounts.mint_authority;
    let payer = &ctx.accounts.payer;
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let token_metadata_program = &ctx.accounts.token_metadata_program;
    let rent = &ctx.accounts.rent;
    let offset_metadata = &ctx.accounts.offset_metadata;
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    let metadata = &mut ctx.accounts.metadata;
    let master_edition = &mut ctx.accounts.master_edition;

    if **ctx.accounts.mint.to_account_info().try_borrow_lamports()? > 0 {
        set_offset_metadata(
            &mint.to_account_info(),
            &mint_authority.to_account_info(),
            offset_metadata,
            offset_amount,
        )?;
        set_metadata_uri(offset_tiers, &metadata.to_account_info(), offset_amount)?;
    } else {
        create_mint(
            &payer.to_account_info(),
            &mint.to_account_info(),
            &mint_authority.key(),
            system_program,
            token_program,
            &rent.to_account_info(),
        )?;

        create_metadata_account(
            name,
            symbol,
            uri.to_string(),
            &metadata.to_account_info(),
            &mint.to_account_info(),
            &mint_authority.to_account_info(),
            &payer.to_account_info(),
            &mint_authority.to_account_info(),
            token_metadata_program,
            system_program,
            &rent.to_account_info(),
        )?;

        // TODO: add global state authority as mint authority and update authority
        create_master_edition_account(
            &metadata.to_account_info(),
            &mint.to_account_info(),
            &mint_authority.to_account_info(),
            &payer.to_account_info(),
            &master_edition.to_account_info(),
            token_metadata_program,
            token_program,
            system_program,
            &ctx.accounts.rent.to_account_info(),
        )?;

        create_offset_metadata_account(
            &crate::ID,
            payer.to_account_info(),
            mint.key(),
            offset_metadata.to_account_info(),
            system_program,
        )?;

        set_offset_metadata(
            &mint.to_account_info(),
            &mint_authority.to_account_info(),
            offset_metadata,
            offset_amount,
        )?;

        set_metadata_uri(offset_tiers, &metadata.to_account_info(), offset_amount)?
    }

    Ok(())
}
