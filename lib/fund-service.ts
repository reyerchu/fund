'use client';

import { ethers } from 'ethers';
import { 
  FUND_FACTORY_ABI, 
  VAULT_PROXY_ABI, 
  COMPTROLLER_ABI, 
  ERC20_ABI,
  FUND_FACTORY_ADDRESS 
} from './contracts';
import type { Fund, CreateFundParams } from '../types/fund';

export class FundService {
  private provider: ethers.BrowserProvider;

  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
  }

  async createFund(params: CreateFundParams): Promise<{
    txHash: string;
    vaultProxy: string;
    comptrollerProxy: string;
  }> {
    const signer = await this.provider.getSigner();
    const factory = new ethers.Contract(FUND_FACTORY_ADDRESS, FUND_FACTORY_ABI, signer);

    const tx = await factory.createNewFund(
      await signer.getAddress(),
      params.fundName,
      params.fundSymbol,
      params.denominationAsset,
      0, // sharesActionTimelock
      '0x', // feeManagerConfigData
      '0x'  // policyManagerConfigData
    );

    const receipt = await tx.wait();
    
    // 從事件中獲取 vault 和 comptroller 地址
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'NewFundCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = factory.interface.parseLog(event);
      if (parsed && parsed.args) {
        return {
          txHash: receipt.hash,
          vaultProxy: parsed.args.vaultProxy,
          comptrollerProxy: parsed.args.comptrollerProxy
        };
      }
    }

    // 如果無法從事件中獲取，嘗試從交易返回值獲取
    throw new Error('無法獲取基金合約地址');
  }

  async getFundDetails(vaultAddress: string, comptrollerAddress: string): Promise<Partial<Fund>> {
    const vault = new ethers.Contract(vaultAddress, VAULT_PROXY_ABI, this.provider);
    const comptroller = new ethers.Contract(comptrollerAddress, COMPTROLLER_ABI, this.provider);

    const [name, symbol, totalSupply, gav, sharePrice, denominationAsset] = await Promise.all([
      vault.name(),
      vault.symbol(),
      vault.totalSupply(),
      comptroller.calcGav(),
      comptroller.calcGrossShareValue(),
      comptroller.getDenominationAsset()
    ]);

    return {
      name,
      symbol,
      totalShares: ethers.formatEther(totalSupply),
      totalAssets: ethers.formatEther(gav),
      sharePrice: ethers.formatEther(sharePrice),
      denominationAsset,
      vaultProxy: vaultAddress,
      comptrollerProxy: comptrollerAddress
    };
  }

  async getUserBalance(vaultAddress: string, userAddress: string): Promise<string> {
    const vault = new ethers.Contract(vaultAddress, VAULT_PROXY_ABI, this.provider);
    const balance = await vault.balanceOf(userAddress);
    return ethers.formatEther(balance);
  }

  async buyShares(comptrollerAddress: string, amount: string, minShares?: string): Promise<string> {
    const signer = await this.provider.getSigner();
    const comptroller = new ethers.Contract(comptrollerAddress, COMPTROLLER_ABI, signer);

    // 獲取計價資產地址和小數位數
    const denominationAssetAddress = await comptroller.getDenominationAsset();
    const token = new ethers.Contract(denominationAssetAddress, ERC20_ABI, this.provider);
    const decimals = await token.decimals();

    // 使用正確的小數位數解析金額
    const investmentAmount = ethers.parseUnits(amount, decimals);
    let minSharesAmount: bigint;
    
    if (minShares && parseFloat(minShares) > 0) {
      minSharesAmount = ethers.parseEther(minShares);
    } else {
      // 默認使用投資金額的 95% 作為最小份額 (假設 1:1 比例)
      minSharesAmount = investmentAmount * BigInt(95) / BigInt(100);
    }

    // 確保最小份額至少為 1 wei
    if (minSharesAmount === BigInt(0)) {
      minSharesAmount = BigInt(1);
    }

    console.log('buyShares params:', {
      amount,
      decimals,
      investmentAmount: investmentAmount.toString(),
      minSharesAmount: minSharesAmount.toString()
    });

    const tx = await comptroller.buyShares(investmentAmount, minSharesAmount);

    const receipt = await tx.wait();
    return receipt.hash;
  }

  async redeemShares(comptrollerAddress: string, shareAmount: string): Promise<string> {
    const signer = await this.provider.getSigner();
    const comptroller = new ethers.Contract(comptrollerAddress, COMPTROLLER_ABI, signer);
    const userAddress = await signer.getAddress();

    const tx = await comptroller.redeemSharesInKind(
      userAddress,
      ethers.parseEther(shareAmount),
      [], // assetsToRedeem - empty for all assets
      []  // assetReceivers - empty for sender
    );

    const receipt = await tx.wait();
    return receipt.hash;
  }

  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    const signer = await this.provider.getSigner();
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // 獲取代幣的小數位數並使用正確的解析方式
    const decimals = await token.decimals();
    const approvalAmount = ethers.parseUnits(amount, decimals);

    console.log('approveToken params:', {
      tokenAddress,
      spenderAddress,
      amount,
      decimals,
      approvalAmount: approvalAmount.toString()
    });

    const tx = await token.approve(spenderAddress, approvalAmount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await token.balanceOf(userAddress);
    const decimals = await token.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  async getTokenAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string): Promise<string> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const allowance = await token.allowance(ownerAddress, spenderAddress);
    const decimals = await token.decimals();
    return ethers.formatUnits(allowance, decimals);
  }
}
