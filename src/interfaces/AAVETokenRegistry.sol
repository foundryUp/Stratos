// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract AAVETokenRegistry {
    // dai/weth means dai to weth
    // dai/weth => array[dai, weth]

    mapping(string => address) private token_to_AAVE_token;

    // Aave aToken addresses
    address constant AWETH = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8; // aWETH
    address constant AUSDC = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c; // aUSDC
    address constant ADAI  = 0x018008bfb33d285247A21d44E50697654f754e63; // aDAI
    address constant ABTC  = 0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8; // aWBTC
    address constant AUSDT  = 0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a; // aUSDT


    constructor() {
        token_to_AAVE_token["weth"] = AWETH;
        token_to_AAVE_token["usdc"] = AUSDC;
        token_to_AAVE_token["dai"]  = ADAI;
        token_to_AAVE_token["btc"]  = ABTC;
        token_to_AAVE_token["usdt"]  = AUSDT;
    }

    function getAAVEAddressFromString(
        string memory tokenName
    ) public view returns (address) {
        return token_to_AAVE_token[tokenName];
    }
}
