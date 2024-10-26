/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/impact_nft.json`.
 */
export type ImpactNft = {
  "address": "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc",
  "metadata": {
    "name": "impactNft",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addLevels",
      "discriminator": [
        101,
        239,
        15,
        85,
        60,
        13,
        183,
        192
      ],
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "signer": true,
          "relations": [
            "globalState"
          ]
        },
        {
          "name": "globalState"
        },
        {
          "name": "offsetTiers",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  102,
                  102,
                  115,
                  101,
                  116,
                  95,
                  116,
                  105,
                  101,
                  114,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "vec": {
              "defined": {
                "name": "level"
              }
            }
          }
        }
      ]
    },
    {
      "name": "createGlobalState",
      "discriminator": [
        53,
        127,
        207,
        143,
        222,
        244,
        229,
        115
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "adminUpdateAuthority",
          "signer": true
        },
        {
          "name": "globalState",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenAuthority",
          "docs": [
            "The account Metaplex recognizes as the update_authority for",
            "the tokens. Any instruction that uses it still requires at least",
            "one of the EOA and PDA authorities for checking validity, but it",
            "can be used with either"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "globalStateCreateInput"
            }
          }
        }
      ]
    },
    {
      "name": "createOffsetTiers",
      "discriminator": [
        155,
        202,
        217,
        142,
        28,
        193,
        122,
        152
      ],
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "signer": true,
          "relations": [
            "globalState"
          ]
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalState"
        },
        {
          "name": "offsetTiers",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  102,
                  102,
                  115,
                  101,
                  116,
                  95,
                  116,
                  105,
                  101,
                  114,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "offsetTiersInput"
            }
          }
        }
      ]
    },
    {
      "name": "mintNft",
      "discriminator": [
        211,
        57,
        6,
        167,
        15,
        219,
        35,
        251
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "adminMintAuthority",
          "signer": true,
          "relations": [
            "globalState"
          ]
        },
        {
          "name": "tokenAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "globalState"
        },
        {
          "name": "offsetTiers",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  102,
                  102,
                  115,
                  101,
                  116,
                  95,
                  116,
                  105,
                  101,
                  114,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "offsetMetadata",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  102,
                  102,
                  115,
                  101,
                  116,
                  95,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "masterEdition",
          "writable": true
        },
        {
          "name": "mintNftTo",
          "docs": [
            "TODO move to init here using anchor's spl-token integration?"
          ],
          "writable": true
        },
        {
          "name": "mintNftToOwner"
        },
        {
          "name": "collectionMint"
        },
        {
          "name": "collectionMetadata",
          "writable": true
        },
        {
          "name": "collectionMasterEdition"
        },
        {
          "name": "collectionAuthorityRecord"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenMetadataProgram",
          "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "offsetAmount",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateGlobalState",
      "discriminator": [
        72,
        50,
        207,
        20,
        119,
        37,
        44,
        182
      ],
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "signer": true,
          "relations": [
            "globalState"
          ]
        },
        {
          "name": "globalState",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "globalStateUpdateInput"
            }
          }
        }
      ]
    },
    {
      "name": "updateNft",
      "discriminator": [
        97,
        5,
        62,
        85,
        23,
        92,
        96,
        25
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "adminMintAuthority",
          "signer": true,
          "relations": [
            "globalState"
          ]
        },
        {
          "name": "tokenAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "globalState"
        },
        {
          "name": "offsetTiers",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  102,
                  102,
                  115,
                  101,
                  116,
                  95,
                  116,
                  105,
                  101,
                  114,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "offsetMetadata",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  102,
                  102,
                  115,
                  101,
                  116,
                  95,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "newCollectionMint"
        },
        {
          "name": "newCollectionMetadata",
          "writable": true
        },
        {
          "name": "newCollectionMasterEdition"
        },
        {
          "name": "collectionMint"
        },
        {
          "name": "collectionMetadata",
          "writable": true
        },
        {
          "name": "collectionMasterEdition"
        },
        {
          "name": "collectionAuthorityRecord"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenMetadataProgram",
          "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
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
      "name": "updateOffsetTiers",
      "discriminator": [
        130,
        140,
        14,
        153,
        113,
        168,
        26,
        245
      ],
      "accounts": [
        {
          "name": "adminUpdateAuthority",
          "signer": true,
          "relations": [
            "globalState"
          ]
        },
        {
          "name": "globalState"
        },
        {
          "name": "offsetTiers",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  102,
                  102,
                  115,
                  101,
                  116,
                  95,
                  116,
                  105,
                  101,
                  114,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "globalState"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "offsetTiersInput"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalState",
      "discriminator": [
        163,
        46,
        74,
        168,
        216,
        123,
        133,
        98
      ]
    },
    {
      "name": "offsetMetadata",
      "discriminator": [
        215,
        158,
        251,
        84,
        102,
        121,
        147,
        129
      ]
    },
    {
      "name": "offsetTiers",
      "discriminator": [
        128,
        104,
        178,
        197,
        181,
        66,
        189,
        30
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAdminAuthority",
      "msg": "Wrong admin authority for offset state"
    },
    {
      "code": 6001,
      "name": "invalidMintAuthority",
      "msg": "Wrong mint authority for offset state"
    },
    {
      "code": 6002,
      "name": "invalidOffsetMetadata",
      "msg": "Invalid offset metadata pda"
    },
    {
      "code": 6003,
      "name": "noOffsetTiers",
      "msg": "Invalid offset tiers pda"
    },
    {
      "code": 6004,
      "name": "invalidUpdateForMint",
      "msg": "Invalid update for mint"
    },
    {
      "code": 6005,
      "name": "invalidFeeRecipient",
      "msg": "Invalid fee recipient account"
    }
  ],
  "types": [
    {
      "name": "coinType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "native"
          },
          {
            "name": "spl"
          }
        ]
      }
    },
    {
      "name": "feeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "feeType",
            "type": {
              "defined": {
                "name": "feeType"
              }
            }
          },
          {
            "name": "coinType",
            "type": {
              "defined": {
                "name": "coinType"
              }
            }
          },
          {
            "name": "splTokenMint",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "feeType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "fixed"
          },
          {
            "name": "percentage"
          }
        ]
      }
    },
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminUpdateAuthority",
            "type": "pubkey"
          },
          {
            "name": "adminMintAuthority",
            "type": "pubkey"
          },
          {
            "name": "levels",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": {
              "option": {
                "defined": {
                  "name": "feeConfig"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "globalStateCreateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminMintAuthority",
            "type": "pubkey"
          },
          {
            "name": "levels",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": {
              "option": {
                "defined": {
                  "name": "feeConfig"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "globalStateUpdateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminUpdateAuthority",
            "type": "pubkey"
          },
          {
            "name": "adminMintAuthority",
            "type": "pubkey"
          },
          {
            "name": "levels",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": {
              "option": {
                "defined": {
                  "name": "feeConfig"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "level",
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
            "type": "pubkey"
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
                "defined": {
                  "name": "level"
                }
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
      "name": "offsetTiersInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "levels",
            "type": {
              "vec": {
                "defined": {
                  "name": "level"
                }
              }
            }
          }
        ]
      }
    }
  ]
};
