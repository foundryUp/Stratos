// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}

interface IPoolAaveV3 {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
    }

contract AaveETHManager {
    address constant aEthAddress = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
    address constant poolAddress = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2; // Aave ETH Mainnet Pool Address
    address constant wethaddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

 
    function depositETH() external payable {
        require(msg.value > 0, "Must send ETH");

        IWETH(wethaddress).deposit{value: msg.value}();
        uint256 wethBalance = IERC20(wethaddress).balanceOf(address(this));

        IERC20(wethaddress).approve(poolAddress, wethBalance);

        IERC20(wethaddress).allowance(address(this), poolAddress);

        IPoolAaveV3(poolAddress).supply(
            wethaddress,
            wethBalance,
            msg.sender,
            0
        );
    }

    function withdrawETH(uint256 aWEthAmount) external {
        require(aWEthAmount > 0, "Invalid aEth amount");
        IPoolAaveV3(poolAddress).withdraw(
            wethaddress,
            IERC20(aEthAddress).balanceOf(address(this)),
            address(this)
        );

        IWETH(wethaddress).withdraw(
            IERC20(wethaddress).balanceOf(address(this))
        );
        (bool ok, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        require(ok, "Withdrawal failed.");
    }


    receive() external payable {}

    fallback() external payable {}
}