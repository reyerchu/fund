// lib/enzyme-sdk-service.ts
'use client';

import { LifeCycle } from "@enzymefinance/sdk";
// import { Policy, Policies } from "@enzymefinance/sdk";

import { ethers } from 'ethers';
import type { CreateFundParams } from '../types/fund';
import { FUND_FACTORY_ABI, FUND_FACTORY_ADDRESS } from "./contracts";
import { Fee, Fees, Policies, Policy } from "@enzymefinance/sdk/Configuration";
import { createWalletClient, custom, http } from 'viem';
import { sepolia } from 'viem/chains';
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
  private walletClient: ReturnType<typeof createWalletClient>;
  
  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found in window.ethereum");
      }
      this.walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum!)
      });
  }

  
  // 創建新基金
  async createFund(params: CreateFundParams): Promise<{
      txHash: string;
      vaultProxy: string;
      comptrollerProxy: string;
    }> {
        const [address] = await this.walletClient.getAddresses();
        console.log('Creating fund with address:', address);
        console.log('Creating fund with Enzyme SDK:', {
        fundName: params.fundName,
        fundSymbol: params.fundSymbol,
        denominationAsset: params.denominationAsset
        });

        // TODO: Define addresses object with contract addresses
        const addresses = {
            fundDeployer: FUND_FACTORY_ADDRESS as `0x${string}`, // Add actual FundDeployer contract address
            managementFee: '0x5c25D5d0C2cad652992bA417f8FA054F8930Ef99' as `0x${string}`, // Add actual ManagementFee contract address
            performanceFee: '0x82EDeB07c051D6461acD30c39b5762D9523CEf1C' as `0x${string}`, // Add actual PerformanceFee contract address
            entranceFee: '0xD00DD49568CE5f8894E7a10f33c0AC513D9552c4' as `0x${string}`, // Add actual EntranceFee contract address
            investorWhitelist: '0x1cF1fb97E6A4AfaA4167FA19d52AD19D6689C677' as `0x${string}`, // Add actual InvestorWhitelist contract address
            minMaxInvestment: '0xe0255c9f3B8e7DC07Cb460D09c713EA51f44feE2' as `0x${string}` // Add actual MinMaxInvestment contract address
        };

        const feeManagerConfigData = await this.prepareFeeConfig(params as EnzymeFundParams, addresses) as `0x${string}`;
        const policyManagerConfigData = await this.preparePolicyConfig(params as EnzymeFundParams, addresses) as `0x${string}`;
    
        const create = LifeCycle.createVault({
            fundDeployer: addresses.fundDeployer, // FundDeployer 合約地址
            owner: address as `0x${string}`, // 基金擁有者地址 (通常是創建者)
            name: params.fundName, // 基金名稱
            symbol: params.fundSymbol, // 基金代號
            denominationAsset: params.denominationAsset as `0x${string}`, // 計價資產地址 (如 USDC)
            sharesActionTimelockInSeconds: BigInt(0), // 贖回時間鎖 (0 表示無限制)
            feeManagerConfigData, // 費用配置 (編碼後的數據)
            policyManagerConfigData, // 政策配置 (編碼後的數據)
        });

        console.log('Sending transaction:', create);

        // const tx = await signer.sendTransaction(createVaultTransaction.params);
        const tx = await this.walletClient.sendTransaction({
          ...create.params,
          account: address as `0x${string}`,
        });

        console.log('Transaction sent:', tx);
        // const receipt = await tx.wait();
      
        // console.log('Transaction confirmed:', receipt);

        // if (!receipt || !receipt.logs) {
        //     throw new Error('Transaction failed or no logs found');
        // }

        // console.log('Transaction logs:', receipt.logs);

        // 從事件中獲取 vault 和 comptroller 地址
        // const event = receipt.logs.find((log: any) => {
        //     try {
        //         const parsed = createVaultTransaction.interface.parseLog(log);
        //         return parsed?.name === 'NewFundCreated';
        //     } catch {
        //         return false;
        //     }
        // });

        // if (event) {
        // const parsed = factory.interface.parseLog(event);
        //     if (parsed && parsed.args) {
        //         return {
        //         txHash: receipt.hash,
        //         vaultProxy: parsed.args.vaultProxy,
        //         comptrollerProxy: parsed.args.comptrollerProxy
        //         };
        //     }
        // }
      
      return {
        txHash: receipt.hash,
        vaultProxy: "",
        comptrollerProxy: ""
      };
    }
    // 使用 Enzyme SDK 編碼費用設定
    private async prepareFeeConfig(params: EnzymeFundParams, addresses: any): Promise<string> {
        const feeConfigs = [];

        // 入場費
        if (params.entranceFeeRate && params.entranceFeeRate > 0) {
            const entranceConfig = Fees.Entrance.encodeDirectFeeSettings({
                rateInBps: BigInt(Math.floor(params.entranceFeeRate * 100)), // 0.5% = 50
            });
            feeConfigs.push({
                address: addresses.entranceFee,
                settings: entranceConfig,
            });
        }

        // 管理費
        if (params.managementFeeRate && params.managementFeeRate > 0) {
            const managementConfig = Fees.Management.encodeSettings({
                perAnnumRate: BigInt(Math.floor((params.managementFeeRate / 100) * 1e18)), // 2% 輸入 0.02 (scaled to 1e18)
            });
            feeConfigs.push({
                address: addresses.managementFee,
                settings: managementConfig,
            });
        }


        // 績效費
        if (params.performanceFeeRate && params.performanceFeeRate > 0) {
            const fee2Config = Fees.Performance.encodePerformanceFeeSettings({
                rateInBps: BigInt(Math.floor(params.performanceFeeRate * 100)), // 20% = 2000
            });
            feeConfigs.push({
                address: addresses.performanceFee,
                settings: fee2Config,
            });
        }

        if (feeConfigs.length === 0) return '0x';

        return Fee.encodeSettings(feeConfigs);
    }

    // 使用 Enzyme SDK 編碼政策設定
    private async preparePolicyConfig(params: EnzymeFundParams, addresses: any): Promise<string> {
        const policyConfigs = [];

        // 最小/最大投資限制
        if (params.minInvestmentAmount || params.maxInvestmentAmount) {
            const policy1Config = Policies.MinMaxInvestment.encodeSettings({
                minInvestmentAmount: params.minInvestmentAmount ? ethers.parseEther(params.minInvestmentAmount) : BigInt(0),
                maxInvestmentAmount: params.maxInvestmentAmount ? ethers.parseEther(params.maxInvestmentAmount) : ethers.MaxUint256,
            });
            policyConfigs.push({
                address: addresses.minMaxInvestment,
                settings: policy1Config,
            });
        }
        
        if (params.investorWhitelist && params.investorWhitelist.length > 0) {
            const policy2Config = Policies.AllowedDepositRecipients.encodeSettings({
                existingListIds: [], // 如果沒有現有的列表 ID，可以留空
                newListsArgs: [{
                    updateType: BigInt(0), // 0 = 新增列表
                    initialItems: params.investorWhitelist.map(addr => addr as `0x${string}`), // 白名單地址列表
                }], 
            });


            policyConfigs.push({
                address: addresses.investorWhitelist,
                settings: policy2Config,
            });
        }


        if (policyConfigs.length === 0) return '0x';

        return Policy.encodeSettings(policyConfigs);
    }

    
}