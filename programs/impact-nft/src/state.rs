use anchor_lang::prelude::*;

#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    pub levels: u16,
    /** number of levels, can probably be capped at u8 or u16 */
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateInput {
    pub authority: Pubkey,
    pub levels: u16,
}

impl GlobalState {
    pub const SPACE: usize = 8 + 32 + 2 + 1;

    pub fn set(&mut self, authority: Pubkey, levels: u16, bump: u8) {
        self.authority = authority;
        self.levels = levels;
        self.bump = bump;
    }
}

/**
 * The Level struct is used to store the offset tiers.
 */
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Level {
    pub offset: u64, // 8
    pub uri: String, // 200
}

#[account]
pub struct OffsetTiers {
    pub authority: Pubkey,
    pub levels: Vec<Level>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OffsetTiersInput {
    pub authority: Pubkey,
    pub levels: Vec<Level>,
}

impl OffsetTiers {
    /** Allocate up to 10 levels (can be modified) */
    pub const SPACE: usize = 8
        + 32            // authority
        + 4             // vec
        + 4             // string
        + (208 * 10)    // 10 levels
        + 1             // bump
        + 8; // discriminator

    pub fn set(&mut self, input: OffsetTiersInput) {
        self.authority = input.authority;
        self.levels = input.levels;
    }

    pub fn get_level(&self, offset: u64) -> Option<&Level> {
        let level_index = match self
            .levels
            .iter()
            .rev()
            .position(|level| level.offset <= offset)
        {
            Some(i) => self.levels.len() - 1 - i,
            None => 0,
        };
        Some(&self.levels[level_index])
    }
}

#[account]
pub struct OffsetMetadata {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub offset: u64,
    pub bump: u8,
}

impl OffsetMetadata {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1;

    pub fn set(&mut self, authority: Pubkey, mint: Pubkey, offset: u64, bump: u8) {
        self.authority = authority;
        self.mint = mint;
        self.offset = offset;
        self.bump = bump;
    }
}
