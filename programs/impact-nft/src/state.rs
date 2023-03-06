use anchor_lang::prelude::*;

#[account]
pub struct GlobalState {
    pub admin_authority: Pubkey, // Typically an EOA
    pub mint_authority: Pubkey,  // Typically a PDA
    // number of levels, can probably be capped at u8 or u16
    pub levels: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateCreateInput {
    pub mint_authority: Pubkey,
    pub levels: u16,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateUpdateInput {
    pub admin_authority: Pubkey,
    pub mint_authority: Pubkey,
    pub levels: u16,
}

impl GlobalState {
    pub const SPACE: usize = 8 + 32 + 32 + 2;

    pub fn set(&mut self, admin_authority: Pubkey, mint_authority: Pubkey, levels: u16) {
        self.admin_authority = admin_authority;
        self.mint_authority = mint_authority;
        self.levels = levels;
    }
}

/**
 * The Level struct is used to store the offset tiers.
 */
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
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
        let index = self.get_index_from_offset(offset)?;
        Some(&self.levels[index])
    }

    pub fn get_index_from_offset(&self, offset: u64) -> Option<usize> {
        let level_index = match self
            .levels
            .iter()
            .rev()
            .position(|level| level.offset <= offset)
        {
            Some(i) => self.levels.len() - 1 - i,
            None => 0,
        };
        Some(level_index)
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

    pub fn set(&mut self, offset: u64, bump: u8, level_index: u16) {
        self.offset = offset;
        self.bump = bump;
        self.current_level_index = level_index;
    }
}
