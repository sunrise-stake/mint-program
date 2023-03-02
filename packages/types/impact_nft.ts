export type ImpactNft = {
  "version": "0.1.0",
  "name": "impact_nft",
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "GlobalStateInput"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "levels",
            "type": "u16"
          },
          {
            "name": "bump",
            "docs": [
              "number of levels, can probably be capped at u8 or u16"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "offsetTiers",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "levels",
            "type": {
              "vec": {
                "defined": "Level"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "offsetMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "offset",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GlobalStateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "levels",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "Level",
      "docs": [
        "* The Level struct is used to store the offset tiers."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offset",
            "type": "u64"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidUpdateAuthority",
      "msg": "Wrong update authority for offset state"
    },
    {
      "code": 6001,
      "name": "InvalidOffsetMetadata",
      "msg": "Invalid offset metadata pda"
    },
    {
      "code": 6002,
      "name": "NoOffsetTiers",
      "msg": "Invalid offset tiers pda"
    },
    {
      "code": 6003,
      "name": "InvalidUpdateForMint",
      "msg": "Invalid update for mint"
    }
  ]
};

export const IDL: ImpactNft = {
  "version": "0.1.0",
  "name": "impact_nft",
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "GlobalStateInput"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "levels",
            "type": "u16"
          },
          {
            "name": "bump",
            "docs": [
              "number of levels, can probably be capped at u8 or u16"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "offsetTiers",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "levels",
            "type": {
              "vec": {
                "defined": "Level"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "offsetMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "offset",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GlobalStateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "levels",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "Level",
      "docs": [
        "* The Level struct is used to store the offset tiers."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offset",
            "type": "u64"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidUpdateAuthority",
      "msg": "Wrong update authority for offset state"
    },
    {
      "code": 6001,
      "name": "InvalidOffsetMetadata",
      "msg": "Invalid offset metadata pda"
    },
    {
      "code": 6002,
      "name": "NoOffsetTiers",
      "msg": "Invalid offset tiers pda"
    },
    {
      "code": 6003,
      "name": "InvalidUpdateForMint",
      "msg": "Invalid update for mint"
    }
  ]
};
