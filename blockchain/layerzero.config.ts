import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'

import type { OAppEdgeConfig, OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MintX',
}

const fujiContract: OmniPointHardhat = {
    eid: EndpointId.AVALANCHE_V2_TESTNET,
    contractName: 'MintX',
}

// const arbitrumContract: OmniPointHardhat = {
//     eid: EndpointId.ARBITRUM_V2_TESTNET,
//     contractName: 'MintX',
// }

// const baseContract: OmniPointHardhat = {
//     eid: EndpointId.BASE_V2_TESTNET,
//     contractName: 'MintX',
// }

// const optimismContract: OmniPointHardhat = {
//     eid: EndpointId.OPTIMISM_V2_TESTNET,
//     contractName: 'MintX',
// }

const DEFAULT_EDGE_CONFIG: OAppEdgeConfig = {
    enforcedOptions: [
        {
            msgType: 1,
            optionType: ExecutorOptionType.LZ_RECEIVE,
            gas: 200_000,
            value: 0,
        },
        {
            msgType: 2,
            optionType: ExecutorOptionType.COMPOSE,
            index: 0,
            gas: 200_000,
            value: 0,
        },
    ],
}

const config: OAppOmniGraphHardhat = {
    contracts: [
        {
            contract: sepoliaContract,
        },
        {
            contract: fujiContract,
        },
        // {
        //     contract: arbitrumContract,
        // },
        // {
        //     contract: baseContract,
        // },
        // {
        //     contract: optimismContract,
        // },
    ],
    connections: [
        {
            from: sepoliaContract,
            to: fujiContract,
            config: DEFAULT_EDGE_CONFIG,
        },
        {
            from: fujiContract,
            to: sepoliaContract,
            config: DEFAULT_EDGE_CONFIG,
        },
        // {
        //     from: arbitrumContract,
        //     to: sepoliaContract,
        //     config: DEFAULT_EDGE_CONFIG,
        // },
        // {
        //     from: sepoliaContract,
        //     to: arbitrumContract,
        //     config: DEFAULT_EDGE_CONFIG,
        // },
        // {
        //     from: arbitrumContract,
        //     to: fujiContract,
        //     config: DEFAULT_EDGE_CONFIG,
        // },
        // {
        //     from: fujiContract,
        //     to: arbitrumContract,
        //     config: DEFAULT_EDGE_CONFIG,
        // },
        // {
        //     from: optimismContract,
        //     to: sepoliaContract,
        //     config: DEFAULT_EDGE_CONFIG,
        // },
        // {
        //     from: sepoliaContract,
        //     to: arbitrumContract,
        //     config: DEFAULT_EDGE_CONFIG,
        // },
    ],
}

export default config
