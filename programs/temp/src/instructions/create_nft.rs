use crate::error::ErrorCode;
use crate::seeds::{GLOBAL_STATE_SEED, OFFSET_METADATA_SEED, OFFSET_TIERS_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
use crate::utils::metaplex::{create_master_edition_account, create_metadata_account};
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
    pub metadata: UncheckedAccount<'info>,
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
    if **ctx.accounts.mint.to_account_info().try_borrow_lamports()? > 0 {
        // TODO: check for offset update
    } else {
        create_mint(
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.mint.to_account_info(),
            &ctx.accounts.mint_authority.key(),
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.rent.to_account_info(),
        )?;

        create_metadata_account(
            name,
            symbol,
            uri.to_string(),
            &ctx.accounts.metadata.to_account_info(),
            &ctx.accounts.mint.to_account_info(),
            &ctx.accounts.mint_authority.to_account_info(),
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.mint_authority.to_account_info(),
            &ctx.accounts.token_metadata_program,
            &ctx.accounts.system_program,
            &ctx.accounts.rent.to_account_info(),
        )?;

        // TODO: add global state authority as mint authority and update authority
        create_master_edition_account(
            &ctx.accounts.metadata.to_account_info(),
            &ctx.accounts.mint.to_account_info(),
            &ctx.accounts.mint_authority.to_account_info(),
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.master_edition.to_account_info(),
            &ctx.accounts.token_metadata_program,
            &ctx.accounts.token_program,
            &ctx.accounts.system_program,
            &ctx.accounts.rent.to_account_info(),
        )?;

        create_offset_metadata_account(
            &crate::ID,
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.mint.key(),
            ctx.accounts.offset_metadata.to_account_info(),
            &ctx.accounts.system_program,
        )?;

        let (offset_metadata_pubkey, offset_metadata_bump) = Pubkey::find_program_address(
            &[OFFSET_METADATA_SEED, ctx.accounts.mint.key().as_ref()],
            &crate::ID,
        );

        if offset_metadata_pubkey != ctx.accounts.offset_metadata.key() {
            return Err(ErrorCode::InvalidOffsetMetadata.into());
        }

        let offset_metadata = &mut ctx.accounts.offset_metadata;
        offset_metadata.set(
            ctx.accounts.mint_authority.key(),
            ctx.accounts.mint.key(),
            offset_amount,
            offset_metadata_bump,
        )
    }

    Ok(())
}
