'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { ethers } from 'ethers';
import { DENOMINATION_ASSETS } from '../lib/contracts';
import { formatTokenAmount } from '../lib/contracts';
import { FundService } from '../lib/fund-service';
import { fundDatabaseService, FundData, InvestmentRecord, UserInvestmentSummary } from '../lib/fund-database-service';

interface ManagerFundDetailsProps {
  fundId: string;
}

export default function ManagerFundDetails({ fundId }: ManagerFundDetailsProps) {
  const { address, isConnected, provider } = useWeb3();
  const [fund, setFund] = useState<FundData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fundNotFound, setFundNotFound] = useState(false);
  
  // Deposit/Redeem states
  const [depositAmount, setDepositAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [userShares, setUserShares] = useState('0');
  
  // 新增：投資記錄相關狀態
  const [investmentHistory, setInvestmentHistory] = useState<InvestmentRecord[]>([]);
  const [investmentSummary, setInvestmentSummary] = useState<UserInvestmentSummary | null>(null);
  const [fundInvestmentHistory, setFundInvestmentHistory] = useState<InvestmentRecord[]>([]);
  
  // Trading states (keep existing)
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeAsset, setTradeAsset] = useState('ETH');
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [isTrading, setIsTrading] = useState(false);

  // 載入基金資料
  useEffect(() => {
    loadFundFromDatabase();
  }, [fundId]);

  // 當基金資料載入且用戶連接錢包時，載入用戶資料
  useEffect(() => {
    if (isConnected && address && provider && fund) {
      loadUserData();
    }
  }, [isConnected, address, provider, fund]);

  const loadFundFromDatabase = async () => {
    setIsLoading(true);
    setFundNotFound(false);
    try {
      console.log('Loading fund with ID:', fundId);
      
      // 從資料庫載入基金資料
      const fundsList = await fundDatabaseService.getFundsByCreator(address || '');
      const foundFund = fundsList.find(f => f.id === fundId);
      
      if (!foundFund) {
        console.warn('Fund not found in database');
        setFundNotFound(true);
        setFund(null);
        return;
      }

      setFund(foundFund);
      console.log('Loaded fund from database:', foundFund);
      
      // 如果有區塊鏈連接，嘗試載入區塊鏈資料
      if (provider && foundFund.vaultProxy && foundFund.comptrollerProxy) {
        try {
          const fundService = new FundService(provider);
          const realFundData = await fundService.getFundDetails(foundFund.vaultProxy, foundFund.comptrollerProxy);
          
          console.log('Loaded fund data from blockchain:', realFundData);
          // 更新基金資料，結合資料庫和區塊鏈資料
          setFund(prev => prev ? {
            ...prev,
            totalAssets: realFundData.totalAssets || prev.totalAssets,
            sharePrice: realFundData.sharePrice || prev.sharePrice,
            totalShares: realFundData.totalShares || prev.totalShares,
            totalInvestors: (realFundData as any).investors || prev.totalInvestors || 0
          } : null);
          
          console.log('Updated with blockchain data:', realFundData);
        } catch (error) {
          console.warn('Failed to load blockchain data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading fund:', error);
      setFundNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!provider || !address || !fund) return;
    
    try {
      const fundService = new FundService(provider);
      
      // Get user's denomination asset balance
      const balance = await fundService.getTokenBalance(fund.denominationAsset, address);
      setUserBalance(balance);
      
      // Get user's fund shares
      const shares = await fundService.getUserBalance(fund.vaultProxy, address);
      setUserShares(shares);

      // 載入投資記錄和總結
      try {
        const [userHistory, userSummary, fundHistory] = await Promise.all([
          fundDatabaseService.getUserFundInvestmentHistory(fund.id, address),
          fundDatabaseService.getUserInvestmentSummary(fund.id, address),
          fundDatabaseService.getFundInvestmentHistory(fund.id)
        ]);

        setInvestmentHistory(userHistory);
        setInvestmentSummary(userSummary);
        setFundInvestmentHistory(fundHistory);
        
        console.log('Loaded investment data:', { userHistory, userSummary, fundHistory });
      } catch (error) {
        console.warn('Failed to load investment records:', error);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // 獲取計價資產
  const denominationAsset = DENOMINATION_ASSETS.find(
    asset => asset.address === fund?.denominationAsset
  ) || DENOMINATION_ASSETS[0];

  const handleDeposit = async () => {
    if (!provider || !address || !depositAmount || !fund) return;

    setIsDepositing(true);
    try {
      const fundService = new FundService(provider);
      
      // Check if user has enough balance
      const balance = parseFloat(userBalance);
      const amount = parseFloat(depositAmount);
      
      if (amount > balance) {
        alert('餘額不足');
        return;
      }

      // Check and approve token allowance first
      const allowance = await fundService.getTokenAllowance(
        fund.denominationAsset, 
        address, 
        fund.comptrollerProxy
      );
      
      if (parseFloat(allowance) < amount) {
        console.log('Approving token...');
        await fundService.approveToken(fund.denominationAsset, fund.comptrollerProxy, depositAmount);
        // Wait a moment for approval to be mined
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Buy shares (deposit)
      const txHash = await fundService.buyShares(fund.comptrollerProxy, depositAmount);
      console.log('Deposit transaction:', txHash);
      
      // 記錄投資操作到資料庫
      try {
        const estimatedShares = (parseFloat(depositAmount) / parseFloat(fund.sharePrice || '1')).toString();
        await fundDatabaseService.recordInvestment({
          fundId: fund.id,
          investorAddress: address,
          type: 'deposit',
          amount: depositAmount,
          shares: estimatedShares,
          sharePrice: fund.sharePrice || '1.00',
          txHash: txHash
        });
        console.log('Investment recorded in database');
      } catch (error) {
        console.warn('Failed to record investment in database:', error);
      }
      
      alert(`成功投資 ${depositAmount} ${denominationAsset.symbol}！`);
      setDepositAmount('');
      
      // Refresh data
      await loadFundFromDatabase();
      await loadUserData();
      
    } catch (error: any) {
      console.error('Deposit failed:', error);
      alert(`投資失敗：${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleRedeem = async () => {
    if (!provider || !address || !redeemAmount || !fund) return;

    setIsRedeeming(true);
    try {
      const fundService = new FundService(provider);
      
      // Check if user has enough shares
      const shares = parseFloat(userShares);
      const amount = parseFloat(redeemAmount);
      
      if (amount > shares) {
        alert('持有份額不足');
        return;
      }

      // Redeem shares
      const txHash = await fundService.redeemShares(fund.comptrollerProxy, redeemAmount);
      console.log('Redeem transaction:', txHash);
      
      // 記錄贖回操作到資料庫
      try {
        const estimatedAmount = (parseFloat(redeemAmount) * parseFloat(fund.sharePrice || '1')).toString();
        await fundDatabaseService.recordInvestment({
          fundId: fund.id,
          investorAddress: address,
          type: 'redeem',
          amount: estimatedAmount,
          shares: redeemAmount,
          sharePrice: fund.sharePrice || '1.00',
          txHash: txHash
        });
        console.log('Redemption recorded in database');
      } catch (error) {
        console.warn('Failed to record redemption in database:', error);
      }
      
      alert(`成功贖回 ${redeemAmount} 份額！`);
      setRedeemAmount('');
      
      // Refresh data
      await loadFundFromDatabase();
      await loadUserData();
      
    } catch (error: any) {
      console.error('Redeem failed:', error);
      alert(`贖回失敗：${error.message}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleTrade = async () => {
    if (!isConnected || !window.ethereum || !tradeAmount) return;

    setIsTrading(true);
    try {
      // In a real application, this would execute trades through the fund
      console.log(`${tradeType} ${tradeAmount} ${tradeAsset}`);
      alert(`${tradeType === 'buy' ? '購買' : '出售'} ${tradeAmount} ${tradeAsset} 成功！`);
      setTradeAmount('');
      await loadFundFromDatabase(); // Refresh fund data
    } catch (error: any) {
      console.error('Trade failed:', error);
      alert(`交易失敗：${error.message}`);
    } finally {
      setIsTrading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">需要連接錢包</h2>
          <p className="text-gray-600 mb-6">請先連接您的錢包以管理基金</p>
          <div className="text-4xl mb-4">🔗</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">載入中...</h2>
          <p className="text-gray-600">正在載入基金詳情</p>
        </div>
      </div>
    );
  }

  if (fundNotFound || !fund) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">基金不存在</h2>
          <p className="text-gray-600 mb-6">找不到指定的基金，請確認基金 ID 是否正確</p>
          <a href="/manager/dashboard" className="btn-primary">
            返回儀表板
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fund Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{fund.fundName}</h1>
          <p className="text-gray-600 mt-2">基金管理 - {fund.fundSymbol}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Fund Overview and Assets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fund Overview */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">基金概覽</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ${formatTokenAmount(fund.totalAssets)}
                  </p>
                  <p className="text-sm text-gray-600">總資產 (AUM)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">${fund.sharePrice || '1.00'}</p>
                  <p className="text-sm text-gray-600">份額淨值</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTokenAmount(fund.totalShares)}
                  </p>
                  <p className="text-sm text-gray-600">已發行份額</p>
                </div>
                {/* <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{fund.totalInvestors || 0}</p>
                  <p className="text-sm text-gray-600">投資人數</p>
                </div> */}
              </div>

              {/* <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">24小時收益</p>
                    <p className="font-medium text-success-600">+0.00%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">7天收益</p>
                    <p className="font-medium text-success-600">+0.00%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">30天收益</p>
                    <p className="font-medium text-success-600">+0.00%</p>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Asset Allocation */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">資產配置</h2>
              
              <div className="space-y-4">
                {/* Mock asset data since it's not in FundData */}
                {[
                  { symbol: 'ETH', percentage: 40, value: fund.totalAssets ? (parseFloat(formatTokenAmount(fund.totalAssets)) * 0.4).toFixed(2) : '0' },
                  { symbol: 'BTC', percentage: 30, value: fund.totalAssets ? (parseFloat(formatTokenAmount(fund.totalAssets)) * 0.3).toFixed(2) : '0' },
                  { symbol: 'ASVT', percentage: 20, value: fund.totalAssets ? (parseFloat(formatTokenAmount(fund.totalAssets)) * 0.2).toFixed(2) : '0' },
                  { symbol: 'USDC', percentage: 10, value: fund.totalAssets ? (parseFloat(formatTokenAmount(fund.totalAssets)) * 0.1).toFixed(2) : '0' }
                ].map((asset: any, index: number) => (
                  <div key={asset.symbol} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-primary-600 font-bold">{asset.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{asset.symbol}</p>
                        <p className="text-sm text-gray-600">{asset.percentage}% 配置</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${parseFloat(asset.value).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </p>
                      <p className="text-sm text-gray-600">{denominationAsset.symbol}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fund Investment History */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">基金投資記錄</h2>
              <div className="space-y-3">
                {fundInvestmentHistory.length > 0 ? (
                  fundInvestmentHistory.slice(0, 10).map((record, index) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {record.type === 'deposit' ? '投資人申購' : '投資人贖回'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.investorAddress.substring(0, 6)}...{record.investorAddress.substring(38)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${record.type === 'deposit' ? 'text-success-600' : 'text-danger-600'}`}>
                          {record.type === 'deposit' ? '+' : '-'}${parseFloat(record.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {parseFloat(record.shares).toFixed(4)} 份額
                        </p>
                        <p className="text-xs text-gray-500">
                          ${parseFloat(record.sharePrice).toFixed(4)}/份額
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <p>暫無投資記錄</p>
                    <p className="text-sm mt-1">投資記錄會在有申購或贖回活動後顯示</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Deposit/Redeem Panel and Settings */}
          <div className="space-y-6">
            {/* User Balance Info */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">我的資產</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">錢包餘額</span>
                  <span className="font-medium">{parseFloat(userBalance).toFixed(6)} {denominationAsset.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">持有份額</span>
                  <span className="font-medium">{parseFloat(userShares).toFixed(6)} 份額</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">投資價值</span>
                  <span className="font-medium">${(parseFloat(userShares) * parseFloat(fund.sharePrice || '1')).toFixed(2)}</span>
                </div>
                
                {/* 顯示投資總結 */}
                {investmentSummary && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">總投入金額</span>
                        <span className="font-medium">${parseFloat(investmentSummary.totalDeposited).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">總贖回金額</span>
                        <span className="font-medium">${parseFloat(investmentSummary.totalRedeemed).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">總收益</span>
                        <span className={`font-medium ${parseFloat(investmentSummary.totalReturn) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                          ${parseFloat(investmentSummary.totalReturn).toFixed(2)} ({investmentSummary.returnPercentage}%)
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Deposit Panel */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">💰 投資基金</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    投資金額 ({denominationAsset.symbol})
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={`可用餘額: ${parseFloat(userBalance).toFixed(4)}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    預計獲得約 {depositAmount ? (parseFloat(depositAmount) / parseFloat(fund.sharePrice || '1')).toFixed(6) : '0'} 份額
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount || parseFloat(depositAmount) > parseFloat(userBalance)}
                  className="w-full py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-success-500 hover:bg-success-600 text-white"
                >
                  {isDepositing && <div className="loading-spinner mr-2"></div>}
                  {isDepositing ? '投資中...' : '投資基金'}
                </button>
              </div>
            </div>

            {/* Redeem Panel */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">💸 贖回基金</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    贖回份額
                  </label>
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder={`持有份額: ${parseFloat(userShares).toFixed(4)}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    預計贖回約 ${redeemAmount ? (parseFloat(redeemAmount) * parseFloat(fund.sharePrice || '1')).toFixed(2) : '0'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRedeemAmount((parseFloat(userShares) * 0.25).toString())}
                    className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setRedeemAmount((parseFloat(userShares) * 0.5).toString())}
                    className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setRedeemAmount((parseFloat(userShares) * 0.75).toString())}
                    className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    75%
                  </button>
                  <button
                    onClick={() => setRedeemAmount(userShares)}
                    className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    全部
                  </button>
                </div>

                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming || !redeemAmount || parseFloat(redeemAmount) > parseFloat(userShares)}
                  className="w-full py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-danger-500 hover:bg-danger-600 text-white"
                >
                  {isRedeeming && <div className="loading-spinner mr-2"></div>}
                  {isRedeeming ? '贖回中...' : '贖回份額'}
                </button>
              </div>
            </div>

            {/* Fund Settings */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">基金設定</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">管理費</span>
                  <span className="font-medium">{fund.managementFee}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">績效費</span>
                  <span className="font-medium">{fund.performanceFee}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">計價資產</span>
                  <span className="font-medium">{denominationAsset.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">狀態</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    fund.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {fund.status === 'active' ? '活躍' : '暫停'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fund Statistics */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">基金統計</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">創立日期</span>
                  <span className="font-medium">{new Date(fund.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">累計申購</span>
                  <span className="font-medium text-success-600">
                    ${fundInvestmentHistory
                      .filter(r => r.type === 'deposit')
                      .reduce((sum, r) => sum + parseFloat(r.amount), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">累計贖回</span>
                  <span className="font-medium text-danger-600">
                    ${fundInvestmentHistory
                      .filter(r => r.type === 'redeem')
                      .reduce((sum, r) => sum + parseFloat(r.amount), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">投資筆數</span>
                  <span className="font-medium">{fundInvestmentHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">當前狀態</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    fund.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {fund.status === 'active' ? '活躍' : '暫停'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
