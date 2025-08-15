// lib/enzyme-sdk-service.ts
'use client';

import { LifeCycle } from "@enzymefinance/sdk";
// import { Policy, Policies } from "@enzymefinance/sdk";

import { ethers } from 'ethers';
import type { CreateFundParams } from '../types/fund';
import { FUND_FACTORY_ABI, FUND_FACTORY_ADDRESS } from "./contracts";

export interface EnzymeFundParams extends CreateFundParams {
  managementFeeRate?: number; // 年化費率百分比，如 2 代表 2%
  performanceFeeRate?: number; // 績效費率百分比，如 20 代表 20%
  entranceFeeRate?: number; // 入場費率百分比，如 0.5 代表 0.5%
  minInvestmentAmount?: string; // 最小投資金額
  maxInvestmentAmount?: string; // 最大投資金額
  investorWhitelist?: string[]; // 投資者白名單
}

export class EnzymeSDKService {
  private provider: ethers.BrowserProvider;

  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
  }

  
  // 創建新基金
  async createFund(params: CreateFundParams): Promise<{
      txHash: string;
      vaultProxy: string;
      comptrollerProxy: string;
    }> {
        const signer = await this.provider.getSigner();
        
        console.log('Creating fund with Enzyme SDK:', {
        fundName: params.fundName,
        fundSymbol: params.fundSymbol,
        denominationAsset: params.denominationAsset
        });

        // TODO: Define addresses object with contract addresses
        const addresses = {
            fundDeployer: '' as `0x${string}`, // Add actual FundDeployer contract address
            managementFee: '' as `0x${string}`, // Add actual ManagementFee contract address
            performanceFee: '' as `0x${string}`, // Add actual PerformanceFee contract address
            entranceFee: '' as `0x${string}`, // Add actual EntranceFee contract address
            investorWhitelist: '' as `0x${string}`, // Add actual InvestorWhitelist contract address
            minMaxInvestment: '' as `0x${string}` // Add actual MinMaxInvestment contract address
        };

        const feeManagerConfigData = await this.prepareFeeConfig(params as EnzymeFundParams, addresses) as `0x${string}`;
        const policyManagerConfigData = await this.preparePolicyConfig(params as EnzymeFundParams, addresses) as `0x${string}`;
    
        const createVaultTransaction = LifeCycle.createVault({
            fundDeployer: addresses.fundDeployer, // FundDeployer 合約地址
            owner: (await signer.getAddress()) as `0x${string}`, // 基金擁有者地址 (通常是創建者)
            name: params.fundName, // 基金名稱
            symbol: params.fundSymbol, // 基金代號
            denominationAsset: params.denominationAsset as `0x${string}`, // 計價資產地址 (如 USDC)
            sharesActionTimelockInSeconds: BigInt(0), // 贖回時間鎖 (0 表示無限制)
            feeManagerConfigData, // 費用配置 (編碼後的數據)
            policyManagerConfigData, // 政策配置 (編碼後的數據)
        });

        console.log('Sending transaction:', createVaultTransaction.params);

      // 發送交易
      const tx = await signer.sendTransaction(createVaultTransaction.params);
      const receipt = await tx.wait();
      
      console.log('Transaction confirmed:', receipt);

      // 從交易收據中解析事件獲取基金地址
      const fundAddresses = await this.parseFundCreationEvents(receipt);
      
      return {
        txHash: receipt.hash,
        vaultProxy: fundAddresses.vaultProxy,
        comptrollerProxy: fundAddresses.comptrollerProxy
      };
    }
    // 準備費用配置數據
    private async prepareFeeConfig(params: EnzymeFundParams, addresses: any): Promise<string> {
        const fees = [];
        const feeSettings = [];

        // 管理費
        if (params.managementFeeRate && params.managementFeeRate > 0) {
        fees.push(addresses.managementFee);
        const scaledPerSecondRate = this.calculateScaledPerSecondRate(params.managementFeeRate);
        feeSettings.push(
            ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [scaledPerSecondRate])
        );
        }

        // 績效費
        if (params.performanceFeeRate && params.performanceFeeRate > 0) {
        fees.push(addresses.performanceFee);
        const performanceFeeRateBps = Math.floor(params.performanceFeeRate * 100);
        const crystalizationPeriod = 30 * 24 * 60 * 60; // 30 天
        
        feeSettings.push(
            ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256'], 
            [performanceFeeRateBps, crystalizationPeriod]
            )
        );
        }

        // 入場費
        if (params.entranceFeeRate && params.entranceFeeRate > 0) {
        fees.push(addresses.entranceFee);
        const entranceFeeRateBps = Math.floor(params.entranceFeeRate * 100);
        
        feeSettings.push(
            ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [entranceFeeRateBps])
        );
        }

        // 如果沒有費用配置，返回空數據
        if (fees.length === 0) {
        return '0x';
        }

        // 編碼費用配置
        return ethers.AbiCoder.defaultAbiCoder().encode(
        ['address[]', 'bytes[]'],
        [fees, feeSettings]
        );
    }

    // 準備政策配置數據
    private async preparePolicyConfig(params: EnzymeFundParams, addresses: any): Promise<string> {
        const policies = [];
        const policySettings = [];

        // 投資者白名單
        if (params.investorWhitelist && params.investorWhitelist.length > 0) {
        policies.push(addresses.investorWhitelist);
        policySettings.push(
            ethers.AbiCoder.defaultAbiCoder().encode(
            ['address[]'], 
            [params.investorWhitelist]
            )
        );
        }

        // 最小/最大投資限制
        if (params.minInvestmentAmount || params.maxInvestmentAmount) {
        policies.push(addresses.minMaxInvestment);
        
        const minAmount = params.minInvestmentAmount 
            ? ethers.parseEther(params.minInvestmentAmount) 
            : 0;
        const maxAmount = params.maxInvestmentAmount 
            ? ethers.parseEther(params.maxInvestmentAmount) 
            : ethers.MaxUint256;

        policySettings.push(
            ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256'], 
            [minAmount, maxAmount]
            )
        );
        }

        // 如果沒有政策配置，返回空數據
        if (policies.length === 0) {
        return '0x';
        }

        // 編碼政策配置
        return ethers.AbiCoder.defaultAbiCoder().encode(
        ['address[]', 'bytes[]'],
        [policies, policySettings]
        );
    }

    // 計算管理費的每秒複合利率
    private calculateScaledPerSecondRate(annualRatePercent: number): bigint {
        // 將年化百分比 (如 2%) 轉換為每秒複合利率
        const annualRate = annualRatePercent / 100; // 轉換為小數
        const secondsPerYear = 365.25 * 24 * 60 * 60;
        const perSecondRate = Math.pow(1 + annualRate, 1 / secondsPerYear) - 1;
        
        // Enzyme 使用 18 位精度
        const scaledRate = Math.floor(perSecondRate * (10 ** 18));
        return BigInt(scaledRate);
    }
}