'use client';

import { useState } from 'react';
import { useWeb3 } from '../../lib/web3-context';

export default function ConnectButton() {
  const { address, isConnected, connect, disconnect, switchNetwork, chainId } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connect();
      
      // Switch to Sepolia if not already connected
      if (chainId !== 11155111) {
        await switchNetwork(11155111);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1:
        return 'Ethereum';
      case 11155111:
        return 'Sepolia';
      case 137:
        return 'Polygon';
      default:
        return 'Unknown';
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        {/* Network indicator */}
        <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            chainId === 11155111 ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
          <span className="text-gray-700">{getNetworkName(chainId)}</span>
        </div>
        
        {/* Address and disconnect button */}
        <div className="flex items-center bg-primary-50 border border-primary-200 rounded-lg">
          <span className="px-3 py-2 text-primary-700 font-medium">
            {formatAddress(address)}
          </span>
          <button
            onClick={handleDisconnect}
            className="px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-r-lg transition-colors"
            title="Disconnect"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="btn-primary flex items-center space-x-2"
    >
      {isLoading ? (
        <>
          <div className="loading-spinner"></div>
          <span>連接中...</span>
        </>
      ) : (
        <>
          <span>連接錢包</span>
          <span className="text-lg">🦊</span>
        </>
      )}
    </button>
  );
}
