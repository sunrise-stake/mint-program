use anchor_lang::prelude::*;

#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    // number of levels, can probably be capped at u8 or u16 
    pub levels: u16,
    
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateInput {
    pub authority: Pubkey,
    pub levels: u16,
}

impl GlobalState {
    pub const SPACE: usize = 8 + 32 + 2;

    pub fn set(&mut self, authority: Pubkey, levels: u16) {
        self.authority = authority;
        self.levels = levels;
    }
}

/**
 * The Level struct is used to store the offset tiers.
 */
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Level {
    pub offset: u64, // 8
    pub uri: String, // 200
    pub name: String, // 30
    pub symbol: String, // 10
}
//TODO: need a way to enforce that neither name nor symbol exceeds their bounds

impl Level {
    pub const SPACE: usize = 8 + 200 + 30 + 15; 
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
    /** Allocate up to 10 levels (can be modified) */
    pub const SPACE: usize = 
        (Level::SPACE * 10)    // 10 levels
        + 1                    // bump
        + 8;                   // discriminator

    pub fn set(&mut self, input: OffsetTiersInput) {
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
    pub offset: u64,
    pub bump: u8,
}

impl OffsetMetadata {
    pub const SPACE: usize = 8 + 8 + 1;

    pub fn set(&mut self, offset: u64, bump: u8) {
        self.offset = offset;
        self.bump = bump;
    }
}
