# DEVnetwork Smart Contract
[![Build Status](https://travis-ci.org/devresearch/devnetwork-token.svg?branch=master)](https://travis-ci.org/devresearch/devnetwork-token)
[![Coverage Status](https://coveralls.io/repos/github/devresearch/devnetwork-token/badge.svg?branch=master)](https://coveralls.io/github/devresearch/devnetwork-token?branch=master)

# Overview

## DEVnetwork Token

The DEVnetwork Token smart contract `DEVToken.sol` is ERC20-compatible and has the following additional characteristics:

1. A fixed supply of pre-minted tokens
2. The ability to burn tokens by a user, removing the tokens from the supply

The token contract includes the following constants:

```javascript
    name             = "DEVToken";
    symbol           = "DEV";
    decimals         = 18;
    INITIAL_SUPPLY   = 400 million DEV
```