const { ethers } = require("ethers");
import { ETH_MAINNET_RPC, SEPOLIA_MAINNET_RPC } from './constant';

// 參數設定
const rpcUrl = SEPOLIA_MAINNET_RPC;
const fundValueCalculatorAddress = "0xe6825017c165994FFb667cB946169F23245B183b"; // FundValueCalculator

const fundValueCalculatorAbi = [
  "function calcGrossShareValue(address _vaultProxy) view returns (address denominationAsset_, uint256 grossShareValue_)",
  "function calcGav(address _vaultProxy) view returns (uint256 gav_)"
];

export async function getRealtimeSharePrice(vaultProxyAddress: string, decimals: number) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(fundValueCalculatorAddress, fundValueCalculatorAbi, provider);
  const [denominationAsset, grossShareValue] = await contract.calcGrossShareValue(vaultProxyAddress);
  console.log("Denomination Asset:", denominationAsset);
  console.log("Real-time Share Price:", ethers.formatUnits(grossShareValue, decimals));
  return ethers.formatUnits(grossShareValue, decimals);
}



export async function getHistoricalSharePrices(comptrollerProxyAddress: string, decimals: number) {
  const performanceFeeAddress = "0x82EDeB07c051D6461acD30c39b5762D9523CEf1C"; // PerformanceFee

  const performanceFeeAbi = [
    "event Settled(address indexed comptrollerProxy, uint256 sharePrice, uint256 sharesDue)"
  ];

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(performanceFeeAddress, performanceFeeAbi, provider);
  console.log("Fetching historical share prices for comptroller proxy:", comptrollerProxyAddress);
  // 過濾 Settled 事件
  const filter = contract.filters.Settled(comptrollerProxyAddress);
  const logs = await contract.queryFilter(filter, 0, "latest");
  console.log("Logs:", logs);
  console.log(`Found ${logs.length} historical price snapshots:`);
  return logs.map((log: any) => ({
    blockNumber: log.blockNumber,
    sharePrice: Number(ethers.formatUnits(log.args.sharePrice, decimals)),
    // 你也可以加上時間戳
    // timestamp: (await provider.getBlock(log.blockNumber)).timestamp
  }));
}

export async function getVaultGAV(vaultProxyAddress: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(fundValueCalculatorAddress, fundValueCalculatorAbi, provider);
  const gav = await contract.calcGav(vaultProxyAddress);

  console.log("Vault GAV:", ethers.formatUnits(gav, 18)); // 假設 GAV 是以 18 decimals 計算
  // GAV 單位是 denomination asset 的最小單位（如 18 decimals）
  return gav;
}