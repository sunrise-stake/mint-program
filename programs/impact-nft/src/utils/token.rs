use crate::seeds::TOKEN_AUTHORITY_SEED;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::create_account;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Token};

pub fn create_mint<'a>(
    payer: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    system_program: &Program<'a, System>,
    token_program: &Program<'a, token::Token>,
    rent_sysvar: &AccountInfo<'a>,
    token_authority: &AccountInfo<'a>,
) -> Result<()> {
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(token::Mint::LEN);
    invoke(
        &create_account(
            payer.key,
            mint.key,
            lamports,
            token::Mint::LEN as u64,
            token_program.key,
        ),
        &[
            payer.clone(),
            mint.clone(),
            system_program.to_account_info().clone(),
        ],
    )?;

    let accounts = token::InitializeMint {
        mint: mint.clone(),
        rent: rent_sysvar.clone(),
    };
    let cpi_ctx = CpiContext::new(token_program.to_account_info(), accounts);
    token::initialize_mint(cpi_ctx, 0, token_authority.key, Some(token_authority.key))
}

pub fn mint_to<'a>(
    token_program: &Program<'a, token::Token>,
    mint: &AccountInfo<'a>,
    token_account: &AccountInfo<'a>,
    global_state: &Pubkey,
    token_authority: &AccountInfo<'a>,
    token_authority_bump: u8,
) -> Result<()> {
    msg!("Minting nft");
    let token_auth_seeds = &[
        TOKEN_AUTHORITY_SEED,
        global_state.as_ref(),
        &[token_authority_bump],
    ];

    token::mint_to(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            token::MintTo {
                mint: mint.to_account_info(),
                to: token_account.to_account_info(),
                authority: token_authority.to_account_info(),
            },
            &[&token_auth_seeds[..]],
        ),
        1,
    )?;
    Ok(())
}

pub fn create_token_account<'a>(
    associated_token_program: &Program<'a, AssociatedToken>,
    payer: &AccountInfo<'a>,
    token_account: &AccountInfo<'a>,
    token_account_owner: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    system_program: &Program<'a, System>,
    token_program: &Program<'a, Token>,
) -> Result<()> {
    msg!("Creating buyer's nft token account");
    anchor_spl::associated_token::create(CpiContext::new(
        associated_token_program.to_account_info(),
        anchor_spl::associated_token::Create {
            payer: payer.to_account_info(),
            associated_token: token_account.to_account_info(),
            authority: token_account_owner.to_account_info(),
            mint: mint.to_account_info(),
            system_program: system_program.to_account_info(),
            token_program: token_program.to_account_info(),
        },
    ))?;

    Ok(())
}
