use crate::error::ErrorCode;
use crate::seeds::{OFFSET_METADATA_SEED, OFFSET_TIERS_SEED, TOKEN_AUTHORITY_SEED};
use crate::state::{GlobalState, OffsetTiers, OffsetMetadata};
use crate::utils::metaplex::{create_master_edition_account, create_metadata_account, verify_nft};
use crate::utils::token::{create_mint, create_token_account, mint_to};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;

/// Permissionless. The required external verification
/// is the admin_mint_authority
#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub admin_mint_authority: Signer<'info>,
    #[account(
        seeds = [TOKEN_AUTHORITY_SEED, global_state.key().as_ref()],
        bump
    )]
    pub token_authority: SystemAccount<'info>,

    #[account(
        has_one = admin_mint_authority @ ErrorCode::InvalidMintAuthority,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
    )]
    pub offset_tiers: Account<'info, OffsetTiers>,
    #[account(
        init,
        seeds = [OFFSET_METADATA_SEED, mint.key().as_ref(), global_state.key().as_ref()],
        space = OffsetMetadata::SPACE,
        payer = payer,
        bump
    )]
    pub offset_metadata: Account<'info, OffsetMetadata>,

    #[account(mut)]
    /// CHECK: Initialized as mint in instruction
    pub mint: Signer<'info>,
    #[account(mut)]
    /// CHECK: Checked in metaplex program
    pub metadata: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked in metaplex program
    pub master_edition: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Initialized in instruction handler as token account
    /// TODO move to init here using anchor's spl-token integration?
    pub mint_nft_to: UncheckedAccount<'info>,
    /// CHECK: The owner of the token account the nft is minted to
    pub mint_nft_to_owner: UncheckedAccount<'info>,

    #[account(address = offset_tiers.levels[0].collection_mint)]
    /// CHECK: Checked by offsetTiers state
    pub collection_mint: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to Metaplex
    #[account(mut)]
    pub collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to Metaplex
    pub collection_master_edition: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = mpl_token_metadata::ID)]
    /// CHECK: Verified program address
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/** TODO: add offset update logic */
pub fn mint_nft_handler(ctx: Context<MintNft>, offset_amount: u64) -> Result<()> {
    let mint = &ctx.accounts.mint;
    let token_authority = &ctx.accounts.token_authority;
    let payer = &ctx.accounts.payer;
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let token_metadata_program = &ctx.accounts.token_metadata_program;
    let rent = &ctx.accounts.rent;
    let offset_tiers = &mut ctx.accounts.offset_tiers;
    let metadata = &mut ctx.accounts.metadata;
    let master_edition = &mut ctx.accounts.master_edition;
    let global_state = &ctx.accounts.global_state;
    let token_authority_bump = *ctx.bumps.get("token_authority").unwrap();

    if offset_tiers.levels.is_empty() {
        return Err(ErrorCode::NoOffsetTiers.into());
    }

    msg!("creating mint");
    create_mint(
        &payer.to_account_info(),
        &mint.to_account_info(),
        system_program,
        token_program,
        &rent.to_account_info(),
        token_authority,
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
        &ctx.accounts.mint_nft_to,
        &global_state.key(),
        token_authority,
        token_authority_bump,
    )?;

    msg!("creating metadata account");
    create_metadata_account(
        &offset_tiers.levels[0],
        &metadata.to_account_info(),
        &mint.to_account_info(),
        &payer.to_account_info(),
        &token_authority.to_account_info(),
        token_metadata_program,
        system_program,
        &rent.to_account_info(),
        &global_state.key(),
        &token_authority.to_account_info(),
        token_authority_bump,
    )?;

    msg!("creating master edition account");
    create_master_edition_account(
        master_edition,
        mint,
        payer,
        metadata,
        token_metadata_program,
        system_program,
        &ctx.accounts.rent.to_account_info(),
        &global_state.key(),
        token_authority,
        token_authority_bump,
    )?;

    ctx.accounts
        .offset_metadata
        .set(offset_amount, *ctx.bumps.get("offset_metadata").unwrap(), 0);

    msg!("Verifying collection");
    verify_nft(
        metadata,
        payer,
        &ctx.accounts.collection_mint,
        &ctx.accounts.collection_metadata,
        &ctx.accounts.collection_master_edition,
        &global_state.key(),
        token_authority,
        token_authority_bump,
    )?;
    Ok(())
}
