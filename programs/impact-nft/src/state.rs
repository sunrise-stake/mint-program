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

#[account]
pub struct GlobalState {
    pub admin_authority: Pubkey, // Typically an EOA
    pub mint_authority: Pubkey,  // Typically a PDA
    // number of levels, can probably be capped at u8 or u16
    pub levels: u16,
    pub fee: Option<FeeConfig>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateCreateInput {
    pub mint_authority: Pubkey,
    pub levels: u16,
    pub fee: Option<FeeConfig>,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GlobalStateUpdateInput {
    pub admin_authority: Pubkey,
    pub mint_authority: Pubkey,
    pub levels: u16,
    pub fee: Option<FeeConfig>,
}

impl GlobalState {
    pub const SPACE: usize = 8 + 32 + 32 + 2 + 1 + FeeConfig::SPACE;

    pub fn set(
        &mut self,
        admin_authority: Pubkey,
        mint_authority: Pubkey,
        levels: u16,
        fee: Option<FeeConfig>,
    ) {
        self.admin_authority = admin_authority;
        self.mint_authority = mint_authority;
        self.levels = levels;
        self.fee = fee;
    }
}

/**
 * The Level struct is used to store the offset tiers.
 */
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Level {
    pub offset: u64,    // 8
    pub uri: String,    // 200
    pub name: String,   // 30
    pub symbol: String, // 10
}
//TODO: need a way to enforce that neither name nor symbol exceeds their bounds

impl Level {
    pub const SPACE: usize = 8 + 200 + 30 + 15;
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
    /** Allocate up to 10 levels (can be modified) */
    pub const SPACE: usize = 4   // vec
        + (Level::SPACE * 10)    // 10 levels
        + 1                      // bump
        + 8; // discriminator

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
}

#[account]
pub struct OffsetMetadata {
    pub offset: u64,
    pub bump: u8,
}

impl OffsetMetadata {
    pub const SPACE: usize = 8 + 8 + 1;

    pub fn set(&mut self, offset: u64, bump: u8) {
        self.set_amount(offset);
        self.bump = bump;
    }

    pub fn set_amount(&mut self, offset: u64) {
        self.offset = offset;
    }
}
