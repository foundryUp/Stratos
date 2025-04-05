    // SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICEth {
    function mint() external payable;
    function redeem(uint256 redeemTokens) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function transfer(address dst, uint256 amount) external returns (bool);
}

contract CompoundETHManager {
    address public immutable cEthAddress=0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;
    ICEth private immutable cEth;

    constructor() {
        cEth = ICEth(cEthAddress);
    }

    function depositETH() external payable {
        require(msg.value > 0, "Must send ETH");
        cEth.mint{value: msg.value}();
        cEth.transfer(msg.sender, cEth.balanceOf(address(this)));
    }

    function withdrawETH(uint256 cEthAmount) external {
        require(cEthAmount > 0, "Invalid cETH amount");
        uint256 result = cEth.redeem(cEthAmount); 
        require(result == 0, "Compound redeem failed");

        // Calculate the amount of ETH to send
        uint256 exchangeRate = cEth.exchangeRateCurrent(); // Get current exchange rate
        uint256 ethAmount = (cEthAmount * exchangeRate) / 1e18; // Calculate ETH equivalent
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");

        require(success, "ETH transfer failed");
    }

    function getExchangeRate() external returns (uint256) {
        return cEth.exchangeRateCurrent();
    }

    function getCETHBalance(address user) external view returns (uint256) {
        return cEth.balanceOf(user);
    }

    receive() external payable {}

    fallback() external payable {}
}
