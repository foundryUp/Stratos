// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

interface IUniswap {
    // router address V02 : 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)  ;


}
