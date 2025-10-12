import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'MintX'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // Retrieve LayerZero's EndpointV2 deployment
    const endpointV2Deployment = await hre.deployments.get('EndpointV2')
    console.log(`EndpointV2 address: ${endpointV2Deployment.address}`)

    const constructorArgs = [
        'MintX',
        'MX',
        endpointV2Deployment.address, // LayerZero's EndpointV2 address
        deployer, // owner
    ]

    // Log the constructor arguments for debugging
    console.log('Deploying with arguments:', constructorArgs)

    // Deploy the MintX contract
    const deploymentResult = await deploy(contractName, {
        from: deployer,
        args: constructorArgs,
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployment result: ${JSON.stringify(deploymentResult, null, 2)}`)

    // Log the deployed contract address
    console.log(`Deployed ${contractName} contract to address: ${deploymentResult.address}`)
    // console.log(`Verify with: npx hardhat verify --network ${hre.network.name} ${deploymentResult.address} ${constructorArgs.join(' ')}`)
}

deploy.tags = [contractName]

export default deploy
