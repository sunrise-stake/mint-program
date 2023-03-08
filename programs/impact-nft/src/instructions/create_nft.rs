use crate::error::ErrorCode;
use crate::seeds::{OFFSET_METADATA_SEED, OFFSET_TIERS_SEED, TOKEN_AUTHORITY_SEED};
use crate::state::{GlobalState, OffsetMetadata, OffsetTiers};
// use crate::utils::fee::handle_fees;
use crate::utils::metaplex::{create_master_edition_account, create_metadata_account, verify_nft};
use crate::utils::token::{create_mint, create_token_account, mint_to};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token};

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
    // RE-ENABLE ONCE FEES ARE SUPPORTED
        // constraint =  global_state.fee.as_ref().and_then(|fee_config| fee_config.spl_token_mint) == payer_token_account.as_ref().map(|payer_token_account| payer_token_account.mint)
    // the fee config recipient must be either the recipient account or the recipient token account, depending on the coin type
    // checked in code as the constraint is too complex to put here
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    #[account(
        seeds = [OFFSET_TIERS_SEED, global_state.key().as_ref()],
        bump,
    )]
    pub offset_tiers: Box<Account<'info, OffsetTiers>>,
    #[account(
        init,
        seeds = [OFFSET_METADATA_SEED, mint.key().as_ref(), global_state.key().as_ref()],
        space = OffsetMetadata::SPACE,
        payer = payer,
        bump
    )]
    pub offset_metadata: Box<Account<'info, OffsetMetadata>>,

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
    // disable fee payment until the client integration supports it
    // #[account(mut)]
    // pub payer_token_account: Option<Box<Account<'info, TokenAccount>>>,
    // /// CHECK, can be anything as long as it matches the recipient in the fee config
    // #[account(mut)]
    // pub recipient: Option<UncheckedAccount<'info>>,
    // #[account(mut)]
    // pub recipient_token_account: Option<Box<Account<'info, TokenAccount>>>,
}

/** TODO: add offset update logic */
pub fn mint_nft_handler(ctx: Context<MintNft>, offset_amount: u64, _principal: u64) -> Result<()> {
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

    // ensure the fee recipient matches the fee config
    // match &ctx.accounts.global_state.fee {
    //     Some(fee_config) => match fee_config.coin_type {
    //         CoinType::Spl => {
    //             require_keys_eq!(
    //                 fee_config.recipient,
    //                 ctx.accounts.recipient_token_account.as_ref().unwrap().key()
    //             );
    //         }
    //         CoinType::Native => {
    //             require_keys_eq!(
    //                 fee_config.recipient,
    //                 ctx.accounts.recipient.as_ref().unwrap().key()
    //             );
    //         }
    //     },
    //     None => {
    //         require!(
    //             ctx.accounts.recipient_token_account.is_none(),
    //             ErrorCode::InvalidFeeRecipient
    //         );
    //         require!(
    //             ctx.accounts.recipient.is_none(),
    //             ErrorCode::InvalidFeeRecipient
    //         );
    //     }
    // }

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

    if let Some(_fee_config) = &ctx.accounts.global_state.fee {
        msg!("Fee config is set but fees are currently disabled");
        // let recipient: AccountInfo = ctx.accounts.recipient.as_ref().map_or_else(
        //     || {
        //         ctx.accounts
        //             .recipient_token_account
        //             .as_ref()
        //             .unwrap()
        //             .to_account_info()
        //     },
        //     |a| a.to_account_info(),
        // );
        // let fee_payer_token_account = ctx
        //     .accounts
        //     .payer_token_account
        //     .as_ref()
        //     .map(|a| a.to_account_info());
        // handle_fees(
        //     token_program,
        //     fee_config,
        //     &ctx.accounts.payer,
        //     fee_payer_token_account,
        //     &recipient,
        //     principal,
        // )?;
    }

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
