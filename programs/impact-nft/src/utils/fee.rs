use crate::state::{CoinType, FeeConfig, FeeType};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Token};

#[allow(dead_code)]
pub fn handle_fees<'a>(
    token_program: &Program<'a, Token>,
    fee_config: &FeeConfig,
    fee_payer: &Signer<'a>,
    fee_payer_token_account: Option<AccountInfo<'a>>,
    recipient: &AccountInfo<'a>, // either a token account or a sol recipient account
    principal: u64,
) -> Result<()> {
    msg!("Handling fees");

    let amount: u64 = match fee_config.fee_type {
        FeeType::Fixed => fee_config.fee,
        FeeType::Percentage => (principal as f64 * fee_config.fee as f64 / 10_000.0) as u64,
    };

    match fee_config.coin_type {
        CoinType::Native => {
            msg!("Transferring {} lamports from {}", amount, fee_payer.key());
            let ix = system_instruction::transfer(&fee_payer.key(), &recipient.key(), amount);
            invoke(&ix, &[fee_payer.to_account_info(), recipient.clone()])?;
        }
        CoinType::Spl => {
            msg!(
                "Transferring {} in SPL-tokens from {}",
                amount,
                fee_payer.key()
            );
            token::transfer(
                CpiContext::new(
                    token_program.to_account_info(),
                    token::Transfer {
                        from: fee_payer_token_account.unwrap().clone(),
                        to: recipient.clone(),
                        authority: fee_payer.to_account_info(),
                    },
                ),
                1,
            )?;
        }
    }
    Ok(())
}
