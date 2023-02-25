use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Wrong update authority for offset state")]
    InvalidUpdateAuthority,
    #[msg("Invalid offset metadata pda")]
    InvalidOffsetMetadata,
    #[msg("Invalid offset tiers pda")]
    NoOffsetTiers,
}
