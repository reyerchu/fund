import { ethers, BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { COMPTROLLER_ABI, VAULT_PROXY_ABI, DENOMINATION_ASSETS } from './contracts';

export interface PerformanceData {
  fundId: string;
  timestamp: number;
  netAssetValue: string;
  totalShares: string;
  sharePrice: string;
  priceChange24h: string;
  priceChangePercentage24h: number;
}

export interface PortfolioItem {
  fundId: string;
  name: string;
  symbol: string;
  shares: string;
  sharePrice: string;
  totalValue: string;
  initialInvestment: string;
  performance: string;
  performanceColor: string;
  denominationAsset: string;
  lastUpdated: number;
}

export interface PortfolioSummary {
  totalValue: string;
  totalGains: string;
  gainsPercentage: string;
  totalFunds: number;
  bestPerformer?: PortfolioItem;
  worstPerformer?: PortfolioItem;
}

class PerformanceService {
  private provider: BrowserProvider | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum);
    }
  }

  async getFundPerformance(fundAddress: string): Promise<PerformanceData | null> {
    if (!this.provider) return null;

    try {
      const comptrollerContract = new Contract(
        fundAddress,
        COMPTROLLER_ABI,
        this.provider
      );

      // Get denomination asset and fund vault
      const denominationAsset = await comptrollerContract.getDenominationAsset();
      // Note: In real implementation, you'd need a method to get vault proxy
      // For now, we'll use a simplified approach
      
      const vaultContract = new Contract(
        fundAddress, // Assuming same address for demo
        VAULT_PROXY_ABI,
        this.provider
      );

      // Get current GAV and total shares (simplified)
      const [gav, totalShares] = await Promise.all([
        comptrollerContract.calcGav(),
        vaultContract.totalSupply()
      ]);

      // Calculate share price
      const sharePrice = totalShares > BigInt(0) ? (gav * parseEther('1')) / totalShares : parseEther('1');

      // For demo purposes, simulate price change (in production, fetch from historical data)
      const mockPriceChange24h = parseEther(
        (Math.random() * 0.1 - 0.05).toFixed(6) // Random change between -5% and +5%
      );
      const priceChangePercentage24h = parseFloat(
        formatEther(mockPriceChange24h * BigInt(100))
      );

      return {
        fundId: fundAddress,
        timestamp: Date.now(),
        netAssetValue: formatEther(gav),
        totalShares: formatEther(totalShares),
        sharePrice: formatEther(sharePrice),
        priceChange24h: formatEther(mockPriceChange24h),
        priceChangePercentage24h
      };
    } catch (error) {
      console.error(`Error fetching performance for fund ${fundAddress}:`, error);
      return null;
    }
  }

  async getUserPortfolio(userAddress: string, fundAddresses: string[]): Promise<PortfolioItem[]> {
    if (!this.provider) return [];

    const portfolioItems: PortfolioItem[] = [];

    for (const fundAddress of fundAddresses) {
      try {
        const comptrollerContract = new Contract(
          fundAddress,
          COMPTROLLER_ABI,
          this.provider
        );

        const vaultContract = new Contract(
          fundAddress, // Simplified approach
          VAULT_PROXY_ABI,
          this.provider
        );

        // Get user's shares and fund metadata
        const [userShares, gav, fundName] = await Promise.all([
          vaultContract.balanceOf(userAddress),
          comptrollerContract.calcGav(),
          vaultContract.name()
        ]);

        if (userShares > BigInt(0)) {
          const denominationAsset = await comptrollerContract.getDenominationAsset();
          const asset = DENOMINATION_ASSETS.find(a => a.address.toLowerCase() === denominationAsset.toLowerCase());
          
          const totalShares = await vaultContract.totalSupply();
          const sharePrice = totalShares > BigInt(0) ? (gav * parseEther('1')) / totalShares : parseEther('1');
          
          const sharesFormatted = formatEther(userShares);
          const sharePriceFormatted = formatEther(sharePrice);
          const totalValue = parseFloat(sharesFormatted) * parseFloat(sharePriceFormatted);

          // Mock initial investment calculation (in production, track this in a subgraph or database)
          const mockInitialInvestment = totalValue * (0.8 + Math.random() * 0.4); // Random between 80-120% of current value
          const performance = ((totalValue - mockInitialInvestment) / mockInitialInvestment * 100);

          portfolioItems.push({
            fundId: fundAddress,
            name: fundName,
            symbol: await vaultContract.symbol(),
            shares: sharesFormatted,
            sharePrice: sharePriceFormatted,
            totalValue: totalValue.toFixed(2),
            initialInvestment: mockInitialInvestment.toFixed(2),
            performance: `${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%`,
            performanceColor: performance >= 0 ? 'text-success-600' : 'text-danger-600',
            denominationAsset: asset?.address || DENOMINATION_ASSETS[0].address,
            lastUpdated: Date.now()
          });
        }
      } catch (error) {
        console.error(`Error fetching portfolio data for fund ${fundAddress}:`, error);
      }
    }

    return portfolioItems;
  }

  calculatePortfolioSummary(portfolio: PortfolioItem[]): PortfolioSummary {
    if (portfolio.length === 0) {
      return {
        totalValue: '0',
        totalGains: '0',
        gainsPercentage: '0',
        totalFunds: 0
      };
    }

    let totalValue = 0;
    let totalInitialInvestment = 0;
    let bestPerformer = portfolio[0];
    let worstPerformer = portfolio[0];

    portfolio.forEach(item => {
      const value = parseFloat(item.totalValue);
      const initial = parseFloat(item.initialInvestment);
      const performanceNum = parseFloat(item.performance.replace('%', '').replace('+', ''));

      totalValue += value;
      totalInitialInvestment += initial;

      if (performanceNum > parseFloat(bestPerformer.performance.replace('%', '').replace('+', ''))) {
        bestPerformer = item;
      }
      if (performanceNum < parseFloat(worstPerformer.performance.replace('%', '').replace('+', ''))) {
        worstPerformer = item;
      }
    });

    const totalGains = totalValue - totalInitialInvestment;
    const gainsPercentage = totalInitialInvestment > 0 ? (totalGains / totalInitialInvestment * 100) : 0;

    return {
      totalValue: totalValue.toFixed(2),
      totalGains: totalGains.toFixed(2),
      gainsPercentage: gainsPercentage.toFixed(2),
      totalFunds: portfolio.length,
      bestPerformer,
      worstPerformer
    };
  }

  // Method to get fund addresses that user has invested in
  async getUserFundAddresses(userAddress: string, allFundAddresses: string[]): Promise<string[]> {
    if (!this.provider) return [];

    const userFunds: string[] = [];

    for (const fundAddress of allFundAddresses) {
      try {
        const comptrollerContract = new Contract(
          fundAddress,
          COMPTROLLER_ABI,
          this.provider
        );

        const vaultContract = new Contract(
          fundAddress, // Simplified approach
          VAULT_PROXY_ABI,
          this.provider
        );

        const userShares = await vaultContract.balanceOf(userAddress);
        if (userShares > BigInt(0)) {
          userFunds.push(fundAddress);
        }
      } catch (error) {
        console.error(`Error checking user shares for fund ${fundAddress}:`, error);
      }
    }

    return userFunds;
  }

  // Simulate real-time price updates (in production, use WebSocket or periodic API calls)
  startRealTimeUpdates(callback: (updates: Map<string, PerformanceData>) => void, fundAddresses: string[]) {
    const interval = setInterval(async () => {
      const updates = new Map<string, PerformanceData>();
      
      for (const fundAddress of fundAddresses) {
        const performance = await this.getFundPerformance(fundAddress);
        if (performance) {
          updates.set(fundAddress, performance);
        }
      }

      callback(updates);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }
}

export const performanceService = new PerformanceService();
export default PerformanceService;
