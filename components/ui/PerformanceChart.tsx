'use client';

import { useState, useEffect } from 'react';

export interface PricePoint {
  timestamp: number;
  price: number;
  date: string;
}

interface PerformanceChartProps {
  fundId: string;
  fundName?: string;
  className?: string;
  height?: number;
}

export default function PerformanceChart({ fundId, fundName, className = '', height = 200 }: PerformanceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateMockPriceHistory();
  }, [timeRange]);

  const generateMockPriceHistory = () => {
    setIsLoading(true);
    
    // Generate mock price history data
    const points = timeRange === '24h' ? 24 : 
                  timeRange === '7d' ? 7 :
                  timeRange === '30d' ? 30 : 90;

    const basePrice = 1.0 + Math.random() * 0.5; // Random base price between 1.0-1.5
    const volatility = 0.02; // 2% daily volatility

    const history: PricePoint[] = [];
    let currentPrice = basePrice;

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = Date.now() - i * (timeRange === '24h' ? 3600000 : 86400000); // 1h or 1d intervals
      const change = (Math.random() - 0.5) * volatility * 2;
      currentPrice *= (1 + change);
      
      history.push({
        timestamp,
        price: currentPrice,
        date: new Date(timestamp).toLocaleDateString()
      });
    }

    setPriceHistory(history);
    setIsLoading(false);
  };

  const calculatePerformance = () => {
    if (priceHistory.length < 2) return { change: 0, percentage: 0 };
    
    const firstPrice = priceHistory[0].price;
    const lastPrice = priceHistory[priceHistory.length - 1].price;
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;
    
    return { change, percentage };
  };

  const { change, percentage } = calculatePerformance();

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className={`bg-gray-300 rounded`} style={{ height: `${height}px` }}></div>
        </div>
      </div>
    );
  }

  // Calculate SVG path for the price chart
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1;

  const svgWidth = 400;
  const svgHeight = height;
  const padding = 20;

  const points = priceHistory.map((point, index) => {
    const x = padding + (index / (priceHistory.length - 1)) * (svgWidth - 2 * padding);
    const y = padding + ((maxPrice - point.price) / priceRange) * (svgHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const isPositive = percentage >= 0;

  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            {fundName || `基金 ${fundId.slice(0, 6)}...`}
          </h3>
          <div className="flex items-center mt-1">
            <span className="text-2xl font-bold text-gray-900">
              ${priceHistory[priceHistory.length - 1]?.price.toFixed(4)}
            </span>
            <span className={`ml-2 px-2 py-1 text-sm rounded-full ${
              isPositive 
                ? 'bg-success-100 text-success-800' 
                : 'bg-danger-100 text-danger-800'
            }`}>
              {isPositive ? '+' : ''}{percentage.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2 mb-4">
        {(['24h', '7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeRange === range
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price line */}
          <polyline
            fill="none"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth="2"
            points={points}
          />
          
          {/* Fill area */}
          <polygon
            fill={isPositive ? 'url(#greenGradient)' : 'url(#redGradient)'}
            points={`${padding},${svgHeight - padding} ${points} ${svgWidth - padding},${svgHeight - padding}`}
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          {/* Data points */}
          {priceHistory.map((point, index) => {
            const x = padding + (index / (priceHistory.length - 1)) * (svgWidth - 2 * padding);
            const y = padding + ((maxPrice - point.price) / priceRange) * (svgHeight - 2 * padding);
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={isPositive ? '#10b981' : '#ef4444'}
                className="opacity-0 hover:opacity-100 transition-opacity"
              >
                <title>{`${point.date}: $${point.price.toFixed(4)}`}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* Price range labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{priceHistory[0]?.date}</span>
          <span>{priceHistory[priceHistory.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}
