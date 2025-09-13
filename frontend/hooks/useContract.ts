import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { SUPPORTED_CHAINS } from '@/constants';
import mintXABIsepolia from '@/config/abi/mintXsepolia.json';
import mintXABIfuji from '@/config/abi/mintXfuji.json';

export const useNFTContract = (chainId?: number) => {
  const { address } = useAccount();
  
  const getContractConfig = (targetChainId: number) => {
    const chainConfig = SUPPORTED_CHAINS[targetChainId];
    const abi = targetChainId === 11155111 ? mintXABIsepolia : mintXABIfuji;
    
    return {
      address: chainConfig?.contractAddress as `0x${string}`,
      abi: abi.abi,
    };
  };

  const { writeContract, isPending, error } = useWriteContract();

  const mintNFT = async (tokenURI: string, targetChainId: number) => {
    const config = getContractConfig(targetChainId);
    
    return writeContract({
      ...config,
      functionName: 'mint',
      args: [address, tokenURI],
    });
  };

  return {
    mintNFT,
    isPending,
    error,
    getContractConfig,
  };
};