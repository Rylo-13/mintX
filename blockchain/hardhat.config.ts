import 'dotenv/config'

import '@nomiclabs/hardhat-etherscan'
import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-etherscan'
import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

const { INFURA_PROJECT_ID, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env

const accounts: HttpNetworkAccountsUserConfig | undefined = PRIVATE_KEY ? [PRIVATE_KEY] : undefined

if (accounts == null) {
    console.warn('Could not find PRIVATE_KEY. It will not be possible to execute transactions.')
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        sepolia: {
            eid: EndpointId.SEPOLIA_V2_TESTNET,
            url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
            accounts,
        },
        fuji: {
            eid: EndpointId.AVALANCHE_V2_TESTNET,
            url: `https://avalanche-fuji.infura.io/v3/${INFURA_PROJECT_ID}`,
            accounts,
        },
        // 'arbitrum-sepolia': {
        //     eid: EndpointId.ARBITRUM_V2_TESTNET,
        //     url: `https://arbitrum-sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
        //     accounts,
        // },
        // 'optimism-goerli': {
        //     eid: EndpointId.OPTIMISM_V2_TESTNET,
        //     url: `https://optimism-goerli.publicnode.com`,
        //     // chainId: ,
        //     accounts,
        // },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
}

export default config
