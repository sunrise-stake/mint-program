use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum FeeType {
    Fixed,
    Percentage,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum CoinType {
    Native,
    Spl,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct FeeConfig {
    pub fee: u64, // if fee_type is Fixed, this is in lamports
    // if fee_type is Percentage, this is in basis points (100bp = 1%)
    pub recipient: Pubkey, // either a token account or a SOL address
    pub fee_type: FeeType,
    pub coin_type: CoinType,
    pub spl_token_mint: Option<Pubkey>, // if recipient is a token account, this is the mint
}
impl FeeConfig {
    pub const SPACE: usize = 8 + 32 + 1 + 1 + (1 + 32);
}

/*
Contains both the admin_update_authority and the admin_mint_authority
for future comparison and verification. Both are external authorities
and at least one is needed for any instruction. The distinction is so
that authority privileges are shared between a signer for permissionless
ixs that can be an external program's PDA, and a signer for permissioned
ixs that don't need to go through the calling program.
*/
#[account]
pub struct GlobalState {
    pub admin_update_authority: Pubkey, // Typically an EOA
    pub admin_mint_authority: Pubkey,   // Typically a PDA
    // number of levels, can probably be capped at u8 or u16
    pub levels: u16,
    pub fee: Option<FeeConfig>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateCreateInput {
    pub admin_mint_authority: Pubkey,
    pub levels: u16,
    pub fee: Option<FeeConfig>,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateUpdateInput {
    pub admin_update_authority: Pubkey,
    pub admin_mint_authority: Pubkey,
    pub levels: u16,
    pub fee: Option<FeeConfig>,
}

impl GlobalState {
    pub const SPACE: usize = 8 + 32 + 32 + 2 + 1 + FeeConfig::SPACE;

    pub fn set(
        &mut self,
        admin_update_authority: Pubkey,
        admin_mint_authority: Pubkey,
        levels: u16,
        fee: Option<FeeConfig>,
    ) {
        self.admin_update_authority = admin_update_authority;
        self.admin_mint_authority = admin_mint_authority;
        self.levels = levels;
        self.fee = fee;
    }
}

/**
 * The Level struct is used to store the offset tiers.
 */
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct Level {
    pub offset: u64,
    pub uri: String,    //mplx limit of 200
    pub name: String,   //mplx limit of 32
    pub symbol: String, //mplx limit of 10
    pub collection_mint: Pubkey,
}

impl Level {
    pub const SPACE: usize = 8 + (4 + 200) + (4 + 32) + (4 + 10) + 15 + 32;
}

#[account]
#[derive(Debug)]
pub struct OffsetTiers {
    pub levels: Vec<Level>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OffsetTiersInput {
    pub levels: Vec<Level>,
}

impl OffsetTiers {
    pub const MAX_LEVELS: usize = 10;
    /** Allocate up to 10 levels (can be modified) */
    pub const SPACE: usize = 4   // vec
        + (Level::SPACE * Self::MAX_LEVELS)
        + 1                      // bump
        + 8; // discriminator

    pub fn set(&mut self, input: OffsetTiersInput) {
        self.levels = input.levels;
    }

    pub fn get_level(&self, offset: u64) -> Option<&Level> {
        // Defaults to zero if level doesn't exist for offset.
        let level_index = self.get_index_from_offset(offset).unwrap_or(0);

        msg!(
            "Level for offset {} is {} (starts at {})",
            offset,
            level_index,
            self.levels[level_index].offset
        );

        if level_index < self.levels.len() - 1 {
            msg!(
                "Next level at offset {}",
                self.levels[level_index + 1].offset
            );
        } else {
            msg!("This is the max level");
        }

        Some(&self.levels[level_index])
    }

    pub fn get_index_from_offset(&self, offset: u64) -> Option<usize> {
        self.levels
            .iter()
            .rev()
            .position(|level| level.offset <= offset)
            .map(|i| self.levels.len() - 1 - i)
    }
}

#[account]
pub struct OffsetMetadata {
    pub current_level_index: u16,
    pub offset: u64,
    pub bump: u8,
}

impl OffsetMetadata {
    pub const SPACE: usize = 8 + 2 + 8 + 1;

    pub fn set_amount(&mut self, offset: u64) {
        self.offset = offset;
    }

    pub fn set_level_index(&mut self, index: usize) {
        self.current_level_index = index as u16;
    }

    pub fn set(&mut self, offset: u64, bump: u8, level_index: usize) {
        self.set_amount(offset);
        self.bump = bump;
        self.set_level_index(level_index);
    }
}
