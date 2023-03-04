use crate::error::ErrorCode;
use crate::seeds::{OFFSET_METADATA_SEED, OFFSET_TIERS_SEED};
use crate::state::{GlobalState, OffsetTiers};
use crate::utils::metaplex::{create_master_edition_account, create_metadata_account};
use crate::utils::offset::set_offset_metadata;
use crate::utils::system::create_offset_metadata_account;
use crate::utils::token::{create_mint, create_token_account, mint_to};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint_authority: Signer<'info>,
    /// CHECK: Initialized as mint in instruction
    #[account(mut)]
    pub mint: Signer<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: Checked in metaplex program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: The owner of the token account the nft is minted to
    pub mint_nft_to_owner: UncheckedAccount<'info>,
    /// CHECK: Initialized in instruction handler
    #[account(mut)]
    pub mint_nft_to: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: Checked in metaplex program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: Checked in metaplex program
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    #[account(
        mut,
        has_one = mint_authority @ ErrorCode::InvalidMintAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    /// CHECK: Created and/or validated in instruction handler
    #[account(
        mut,
        seeds = [OFFSET_METADATA_SEED, mint.key().as_ref()],
        bump
    )]
    pub offset_metadata: UncheckedAccount<'info>, // so it doesn't fail here for uninitialized accounts
}

/** TODO: add offset update logic */
pub fn mint_nft_handler(ctx: Context<MintNft>, offset_amount: u64) -> Result<()> {
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

    if offset_tiers.levels.is_empty() {
        return Err(ErrorCode::NoOffsetTiers.into());
    }

    msg!("creating mint");
    create_mint(
        &payer.to_account_info(),
        &mint.to_account_info(),
        mint_authority,
        system_program,
        token_program,
        &rent.to_account_info(),
    )?;

    create_token_account(
        &ctx.accounts.associated_token_program,
        payer,
        &ctx.accounts.mint_nft_to,
        &ctx.accounts.mint_nft_to_owner,
        &ctx.accounts.mint,
        &ctx.accounts.system_program,
        &ctx.accounts.token_program,
    )?;

    mint_to(
        token_program,
        mint,
        mint_authority,
        &ctx.accounts.mint_nft_to,
    )?;

    msg!("creating metadata account");
    create_metadata_account(
        &offset_tiers.levels[0],
        &metadata.to_account_info(),
        &mint.to_account_info(),
        &mint_authority.to_account_info(),
        &payer.to_account_info(),
        &mint_authority.to_account_info(),
        token_metadata_program,
        system_program,
        &rent.to_account_info(),
    )?;

    msg!("creating master edition account");
    // TODO: add global state authority as mint authority and update authority
    create_master_edition_account(
        mint_authority,
        master_edition,
        mint,
        mint_authority,
        payer,
        metadata,
        token_metadata_program,
        system_program,
        &ctx.accounts.rent.to_account_info(),
    )?;

    msg!("creating offset metadata account");

    create_offset_metadata_account(
        &crate::ID,
        payer.to_account_info(),
        mint.key(),
        offset_metadata.to_account_info(),
        system_program,
        *ctx.bumps.get("offset_metadata").unwrap(),
    )?;

    msg!("setting offset metadata");
    set_offset_metadata(
        offset_metadata,
        offset_amount,
        *ctx.bumps.get("offset_metadata").unwrap(),
    )?;
    Ok(())
}
