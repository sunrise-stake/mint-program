export type ImpactNft = {
  "version": "0.1.0",
  "name": "impact_nft",
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The account Metaplex recognizes as the update_authority for",
            "the tokens. Any instruction that uses it still requires at least",
            "one of the EOA and PDA authorities for checking validity, but it",
            "can be used with either"
          ]
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
            "defined": "GlobalStateCreateInput"
          }
        }
      ]
    },
    {
      "name": "updateGlobalState",
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "GlobalStateUpdateInput"
          }
        }
      ]
    },
    {
      "name": "createOffsetTiers",
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
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
            "defined": "OffsetTiersInput"
          }
        }
      ]
    },
    {
      "name": "updateOffsetTiers",
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "OffsetTiersInput"
          }
        }
      ]
    },
    {
      "name": "mintNft",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "adminMintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintNftTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintNftToOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offsetAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateNft",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "adminMintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "newCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offsetAmount",
          "type": "u64"
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
            "name": "adminUpdateAuthority",
            "type": "publicKey"
          },
          {
            "name": "adminMintAuthority",
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
      "name": "offsetTiers",
      "type": {
        "kind": "struct",
        "fields": [
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
            "name": "currentLevelIndex",
            "type": "u16"
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
      "name": "GlobalStateCreateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminMintAuthority",
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
      "name": "GlobalStateUpdateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminUpdateAuthority",
            "type": "publicKey"
          },
          {
            "name": "adminMintAuthority",
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
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "collectionMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "OffsetTiersInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "levels",
            "type": {
              "vec": {
                "defined": "Level"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAdminAuthority",
      "msg": "Wrong admin authority for offset state"
    },
    {
      "code": 6001,
      "name": "InvalidMintAuthority",
      "msg": "Wrong mint authority for offset state"
    },
    {
      "code": 6002,
      "name": "InvalidOffsetMetadata",
      "msg": "Invalid offset metadata pda"
    },
    {
      "code": 6003,
      "name": "NoOffsetTiers",
      "msg": "Invalid offset tiers pda"
    },
    {
      "code": 6004,
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The account Metaplex recognizes as the update_authority for",
            "the tokens. Any instruction that uses it still requires at least",
            "one of the EOA and PDA authorities for checking validity, but it",
            "can be used with either"
          ]
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
            "defined": "GlobalStateCreateInput"
          }
        }
      ]
    },
    {
      "name": "updateGlobalState",
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "GlobalStateUpdateInput"
          }
        }
      ]
    },
    {
      "name": "createOffsetTiers",
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
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
            "defined": "OffsetTiersInput"
          }
        }
      ]
    },
    {
      "name": "updateOffsetTiers",
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "OffsetTiersInput"
          }
        }
      ]
    },
    {
      "name": "mintNft",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "adminMintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintNftTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintNftToOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offsetAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateNft",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "adminMintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "newCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offsetAmount",
          "type": "u64"
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
            "name": "adminUpdateAuthority",
            "type": "publicKey"
          },
          {
            "name": "adminMintAuthority",
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
      "name": "offsetTiers",
      "type": {
        "kind": "struct",
        "fields": [
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
            "name": "currentLevelIndex",
            "type": "u16"
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
      "name": "GlobalStateCreateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminMintAuthority",
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
      "name": "GlobalStateUpdateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminUpdateAuthority",
            "type": "publicKey"
          },
          {
            "name": "adminMintAuthority",
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
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "collectionMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "OffsetTiersInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "levels",
            "type": {
              "vec": {
                "defined": "Level"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAdminAuthority",
      "msg": "Wrong admin authority for offset state"
    },
    {
      "code": 6001,
      "name": "InvalidMintAuthority",
      "msg": "Wrong mint authority for offset state"
    },
    {
      "code": 6002,
      "name": "InvalidOffsetMetadata",
      "msg": "Invalid offset metadata pda"
    },
    {
      "code": 6003,
      "name": "NoOffsetTiers",
      "msg": "Invalid offset tiers pda"
    },
    {
      "code": 6004,
      "name": "InvalidUpdateForMint",
      "msg": "Invalid update for mint"
    }
  ]
};
