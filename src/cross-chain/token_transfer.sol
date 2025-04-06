// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helper.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";

contract CCIPTokenTransfer is Helper {
    event CCIPMessageSent(bytes32 indexed messageId);

    /**
     * @notice Transfers tokens via Chainlink CCIP.
     * @param source The source network configuration.
     * @param destination The destination network configuration.
     * @param receiver The recipient address on the destination chain.
     * @param tokenToSend The ERC20 token address to send.
     * @param amount The amount of tokens to send.
     * @param payFeesIn Whether to pay fees in LINK or native token.
     * @return messageId The identifier for the sent CCIP message.
     */
    function sendToken(
        SupportedNetworks source,
        SupportedNetworks destination,
        address receiver,
        address tokenToSend,
        uint256 amount,
        PayFeesIn payFeesIn
    ) external payable returns (bytes32 messageId) {
        // Get router and fee token addresses for the source network
        (address sourceRouter, address linkToken, , ) = getConfigFromNetwork(source);
        // Get destination chainId from the destination network configuration
        (, , , uint64 destinationChainId) = getConfigFromNetwork(destination);

        // Pull the tokens from the caller. The caller must have approved this contract.
        IERC20(tokenToSend).transferFrom(msg.sender, address(this), amount);
        // Approve the router to spend the tokens
        IERC20(tokenToSend).approve(sourceRouter, amount);

        // Prepare the token transfer details
        Client.EVMTokenAmount[] memory tokensToSendDetails = new Client.EVMTokenAmount[](1);
        tokensToSendDetails[0] = Client.EVMTokenAmount({token: tokenToSend, amount: amount});

        // Build the CCIP message payload
        Client.EVM2AnyMessage memory messagePayload = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: "",
            tokenAmounts: tokensToSendDetails,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 0})),
            feeToken: payFeesIn == PayFeesIn.LINK ? linkToken : address(0)
        });

        // Determine the fees required for the transfer
        uint256 fees = IRouterClient(sourceRouter).getFee(destinationChainId, messagePayload);

        // If paying fees in LINK, approve the router to spend the LINK tokens
        if (payFeesIn == PayFeesIn.LINK) {
            IERC20(linkToken).approve(sourceRouter, fees);
            messageId = IRouterClient(sourceRouter).ccipSend(destinationChainId, messagePayload);
        } else {
            // Otherwise, send native currency along with the transaction to cover fees
            messageId = IRouterClient(sourceRouter).ccipSend{value: fees}(destinationChainId, messagePayload);
        }

        emit CCIPMessageSent(messageId);
    }
}
