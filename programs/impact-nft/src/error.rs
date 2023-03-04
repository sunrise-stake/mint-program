use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Wrong admin authority for offset state")]
    InvalidAdminAuthority,
    #[msg("Wrong mint authority for offset state")]
    InvalidMintAuthority,
    #[msg("Invalid offset metadata pda")]
    InvalidOffsetMetadata,
    #[msg("Invalid offset tiers pda")]
    NoOffsetTiers,
    #[msg("Invalid update for mint")]
    InvalidUpdateForMint,
}
