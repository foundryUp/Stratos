// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Helper {
    // Supported Networks (only allowed networks remain)
    enum SupportedNetworks {
        ETHEREUM_SEPOLIA,   // Mainnet Sepolia
        AVALANCHE_FUJI,
        ARBITRUM_SEPOLIA,
        POLYGON_MUMBAI,     // Polygon testnet
        OPTIMISM_SEPOLIA,
        BASE_SEPOLIA,
        ZKSYNC_SEPOLIA
    }

    mapping(SupportedNetworks => string) public networks;

    enum PayFeesIn {
        Native,
        LINK
    }

    /* ==================== Chain IDs ==================== */
    uint64 constant chainIdEthereumSepolia = 16015286601757825753;
    uint64 constant chainIdAvalancheFuji = 14767482510784806043;
    uint64 constant chainIdArbitrumSepolia = 3478487238524512106;
    uint64 constant chainIdPolygonMumbai = 12532609583862916517;
    uint64 constant chainIdOptimismSepolia = 5224473277236331295;
    uint64 constant chainIdBaseSepolia = 10344971235874465080;
    uint64 constant chainIdZksyncSepolia = 6898391096552792247;

    /* ==================== Router Addresses ==================== */
    address constant routerEthereumSepolia = 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59;
    address constant routerAvalancheFuji = 0xF694E193200268f9a4868e4Aa017A0118C9a8177;
    address constant routerArbitrumSepolia = 0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165;
    address constant routerPolygonMumbai = 0x1035CabC275068e0F4b745A29CEDf38E13aF41b1;
    address constant routerOptimismSepolia = 0x114A20A10b43D4115e5aeef7345a1A71d2a60C57;
    address constant routerBaseSepolia = 0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93;
    address constant routerZksyncSepolia = 0xA1fdA8aa9A8C4b945C45aD30647b01f07D7A0B16;

    /* ==================== Link Addresses ==================== */
    address constant linkEthereumSepolia = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
    address constant linkAvalancheFuji = 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846;
    address constant linkArbitrumSepolia = 0xb1D4538B4571d411F07960EF2838Ce337FE1E80E;
    address constant linkPolygonMumbai = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;
    address constant linkOptimismSepolia = 0xE4aB69C077896252FAFBD49EFD26B5D171A32410;
    address constant linkBaseSepolia = 0xE4aB69C077896252FAFBD49EFD26B5D171A32410;
    address constant linkZksyncSepolia = 0x23A1aFD896c8c8876AF46aDc38521f4432658d1e;

    /* ==================== Wrapped Native Addresses ==================== */
    address constant wethEthereumSepolia = 0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534;
    address constant wavaxAvalancheFuji = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
    address constant wethArbitrumSepolia = 0xE591bf0A0CF924A0674d7792db046B23CEbF5f34;
    address constant wmaticPolygonMumbai = 0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889;
    address constant wethOptimismSepolia = 0x4200000000000000000000000000000000000006;
    address constant wethBaseSepolia = 0x4200000000000000000000000000000000000006;
    address constant wethZksyncSepolia = 0x4317b2eCD41851173175005783322D29E9bAee9E;

    /* ==================== CCIP-BnM Addresses ==================== */
    address constant ccipBnMEthereumSepolia = 0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05;
    address constant ccipBnMArbitrumSepolia = 0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D;
    address constant ccipBnMAvalancheFuji = 0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4;
    address constant ccipBnMPolygonMumbai = 0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40;
    address constant ccipBnMOptimismSepolia = 0x8aF4204e30565DF93352fE8E1De78925F6664dA7;
    address constant ccipBnMBaseSepolia = 0x88A2d74F47a237a62e7A51cdDa67270CE381555e;
    // (No dummy token for zkSync Sepolia; return address(0) for such cases.)

    /* ==================== CCIP-LnM Addresses ==================== */
    address constant ccipLnMEthereumSepolia = 0x466D489b6d36E7E3b824ef491C225F5830E81cC1;
    address constant clCcipLnMArbitrumSepolia = 0x139E99f0ab4084E14e6bb7DacA289a91a2d92927;
    address constant clCcipLnMAvalancheFuji = 0x70F5c5C40b873EA597776DA2C21929A8282A3b35;
    address constant clCcipLnMPolygonMumbai = 0xc1c76a8c5bFDE1Be034bbcD930c668726E7C1987;
    address constant clCcipLnMOptimismSepolia = 0x044a6B4b561af69D2319A2f4be5Ec327a6975D0a;
    address constant clCcipLnMBaseSepolia = 0xA98FA8A008371b9408195e52734b1768c0d1Cb5c;
    // (No dummy token for zkSync Sepolia; return address(0) for such cases.)

    constructor() {
        networks[SupportedNetworks.ETHEREUM_SEPOLIA] = "Ethereum Sepolia";
        networks[SupportedNetworks.AVALANCHE_FUJI] = "Avalanche Fuji";
        networks[SupportedNetworks.ARBITRUM_SEPOLIA] = "Arbitrum Sepolia";
        networks[SupportedNetworks.POLYGON_MUMBAI] = "Polygon Mumbai";
        networks[SupportedNetworks.OPTIMISM_SEPOLIA] = "Optimism Sepolia";
        networks[SupportedNetworks.BASE_SEPOLIA] = "Base Sepolia";
        networks[SupportedNetworks.ZKSYNC_SEPOLIA] = "zkSync Sepolia";
    }

    /**
     * @notice Returns dummy CCIP token addresses for a given network.
     * @dev For networks where dummy tokens are not defined, address(0) is returned.
     */
    function getDummyTokensFromNetwork(SupportedNetworks network)
        internal
        pure
        returns (address ccipBnM, address ccipLnM)
    {
        if (network == SupportedNetworks.ETHEREUM_SEPOLIA) {
            return (ccipBnMEthereumSepolia, ccipLnMEthereumSepolia);
        } else if (network == SupportedNetworks.ARBITRUM_SEPOLIA) {
            return (ccipBnMArbitrumSepolia, clCcipLnMArbitrumSepolia);
        } else if (network == SupportedNetworks.AVALANCHE_FUJI) {
            return (ccipBnMAvalancheFuji, clCcipLnMAvalancheFuji);
        } else if (network == SupportedNetworks.POLYGON_MUMBAI) {
            return (ccipBnMPolygonMumbai, clCcipLnMPolygonMumbai);
        } else if (network == SupportedNetworks.OPTIMISM_SEPOLIA) {
            return (ccipBnMOptimismSepolia, clCcipLnMOptimismSepolia);
        } else if (network == SupportedNetworks.BASE_SEPOLIA) {
            return (ccipBnMBaseSepolia, clCcipLnMBaseSepolia);
        } else if (network == SupportedNetworks.ZKSYNC_SEPOLIA) {
            return (address(0), address(0));
        }
    }

    /**
     * @notice Returns the router, LINK token, wrapped native asset, and chain ID for a given network.
     */
    function getConfigFromNetwork(SupportedNetworks network)
        internal
        pure
        returns (address router, address linkToken, address wrappedNative, uint64 chainId)
    {
        if (network == SupportedNetworks.ETHEREUM_SEPOLIA) {
            return (routerEthereumSepolia, linkEthereumSepolia, wethEthereumSepolia, chainIdEthereumSepolia);
        } else if (network == SupportedNetworks.AVALANCHE_FUJI) {
            return (routerAvalancheFuji, linkAvalancheFuji, wavaxAvalancheFuji, chainIdAvalancheFuji);
        } else if (network == SupportedNetworks.ARBITRUM_SEPOLIA) {
            return (routerArbitrumSepolia, linkArbitrumSepolia, wethArbitrumSepolia, chainIdArbitrumSepolia);
        } else if (network == SupportedNetworks.POLYGON_MUMBAI) {
            return (routerPolygonMumbai, linkPolygonMumbai, wmaticPolygonMumbai, chainIdPolygonMumbai);
        } else if (network == SupportedNetworks.OPTIMISM_SEPOLIA) {
            return (routerOptimismSepolia, linkOptimismSepolia, wethOptimismSepolia, chainIdOptimismSepolia);
        } else if (network == SupportedNetworks.BASE_SEPOLIA) {
            return (routerBaseSepolia, linkBaseSepolia, wethBaseSepolia, chainIdBaseSepolia);
        } else if (network == SupportedNetworks.ZKSYNC_SEPOLIA) {
            return (routerZksyncSepolia, linkZksyncSepolia, wethZksyncSepolia, chainIdZksyncSepolia);
        }
    }
}
