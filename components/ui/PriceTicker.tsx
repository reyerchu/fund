'use client';

import { useState, useEffect } from 'react';
import { fundDatabaseService, FundData } from '../../lib/fund-database-service';

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: number;
  fundId: string;
}

export default function PriceTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [funds, setFunds] = useState<FundData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFundsFromDatabase();
  }, []);

  useEffect(() => {
    if (funds.length > 0) {
      loadInitialData();
      const interval = setInterval(updatePrices, 15000); // Update every 15 seconds
      
      return () => clearInterval(interval);
    }
  }, [funds]);

  const loadFundsFromDatabase = async () => {
    try {
      setIsLoading(true);
      const allFunds = await fundDatabaseService.getAllFunds();
      // 只顯示活躍的基金
      const activeFunds = allFunds.filter(fund => fund.status === 'active');
      setFunds(activeFunds);
    } catch (error) {
      console.error('Error loading funds for ticker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    const initialData: TickerItem[] = funds.map(fund => {
      // 使用基金的 sharePrice 或預設為 1.00
      const basePrice = parseFloat(fund.sharePrice || '1.00');
      // 添加小幅隨機波動 (±5%)
      const priceVariation = (Math.random() - 0.5) * 0.1;
      const currentPrice = basePrice * (1 + priceVariation);
      const change = currentPrice - basePrice;
      const changePercent = (change / basePrice) * 100;

      return {
        fundId: fund.id,
        symbol: fund.fundSymbol,
        name: fund.fundName,
        price: currentPrice.toFixed(4),
        change: change >= 0 ? `+${change.toFixed(4)}` : change.toFixed(4),
        changePercent
      };
    });
    
    setTickerData(initialData);
  };

  const updatePrices = () => {
    setTickerData(prevData => 
      prevData.map(item => {
        // 更小幅度的價格波動 (±0.5%)
        const priceChange = (Math.random() - 0.5) * 0.01;
        const newPrice = parseFloat(item.price) * (1 + priceChange);
        const previousPrice = parseFloat(item.price);
        const change = newPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;
        
        return {
          ...item,
          price: newPrice.toFixed(4),
          change: change >= 0 ? `+${change.toFixed(4)}` : change.toFixed(4),
          changePercent
        };
      })
    );
  };

  if (!isVisible) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white py-2 px-4 relative overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1 text-sm">
            <span className="text-gray-400 animate-pulse">●</span>
            <span className="font-medium">載入中</span>
            <span className="text-gray-400">正在載入基金報價...</span>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (tickerData.length === 0) {
    return (
      <div className="bg-gray-900 text-white py-2 px-4 relative overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1 text-sm">
            <span className="text-gray-400">●</span>
            <span className="font-medium">無基金資料</span>
            <span className="text-gray-400">目前沒有可顯示的基金</span>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white py-2 px-4 relative overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-1 text-sm">
          <span className="text-success-400 animate-pulse">●</span>
          <span className="font-medium">LIVE</span>
          <span className="text-gray-400">即時基金報價</span>
          <span className="text-xs text-gray-500">({tickerData.length} 檔基金)</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadFundsFromDatabase}
            className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-gray-800"
            title="重新載入基金資料"
          >
            🔄
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
            title="關閉即時報價"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex animate-scroll space-x-8">
          {/* Duplicate the data to create seamless scrolling */}
          {[...tickerData, ...tickerData].map((item, index) => (
            <div 
              key={`${item.symbol}-${index}`}
              className="flex items-center space-x-3 whitespace-nowrap"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{item.symbol}</span>
                <span className="text-xs text-gray-400 truncate max-w-24" title={item.name}>
                  {item.name}
                </span>
              </div>
              <span className="text-gray-300 font-mono">${item.price}</span>
              <span className={`text-sm font-medium ${
                item.changePercent >= 0 ? 'text-success-400' : 'text-danger-400'
              }`}>
                {item.change} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
