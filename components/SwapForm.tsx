'use client';

import { FundService } from "@/lib/fund-service";
import { ethers } from "ethers";
import { useState } from "react";

const TOKENS = [
  { symbol: "ASVT", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" },
  { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
];

export default function SwapForm({ onSwap }: { onSwap?: (data: any) => void }) {
  if (!window.ethereum) return;
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [amount, setAmount] = useState("");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const fundService = new FundService(provider);

  const handleSubmit = async() => {
    console.log("Swap start -----")
    await fundService.swapViaUniswap({
      comptrollerAddress: "0x0d8e50ff6D37A285437034fe30e49B90639C7EfD",
      integrationManagerAddress: "0xA324963ED9c3124BB5b722a6790f67d72922F7a4",
      uniswapAdapterAddress: "0xb179bA4c1b407E24610b410bA383Aadc2e3B88Be",
      fromTokenAddress: "0x932b08d5553b7431FB579cF27565c7Cd2d4b8fE0",
      toTokenAddress: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // 或其他你想換的 token
      fromAmount: "500", // 你要換出去的 WETH 數量
      minToAmount: "0.001",
      toTokenDecimals: 18    // 最少要換到多少 USDC (6 decimals)
});
  }

  return (
    <form
      className="card bg-white shadow-lg rounded-xl p-6 space-y-6"
      onSubmit={e => {
        e.preventDefault();
        if (onSwap) onSwap({ fromToken, toToken, amount });
      }}
    >
      {/* Sell Section */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Sell</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            className="input input-bordered flex-1"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <select
            className="select select-bordered min-w-[110px]"
            value={fromToken.symbol}
            onChange={e => setFromToken(TOKENS.find(t => t.symbol === e.target.value)!)}
          >
            {TOKENS.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="flex justify-center">
        <button
          type="button"
          className="btn btn-circle bg-primary-100 hover:bg-primary-200 text-primary-600 border-none shadow"
          onClick={() => {
            setFromToken(toToken);
            setToToken(fromToken);
          }}
          aria-label="Swap tokens"
        >
          <span className="text-2xl">↓</span>
        </button>
      </div>

      {/* Buy Section */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Buy</label>
        <div className="flex gap-2">
          <select
            className="select select-bordered flex-1"
            value={toToken.symbol}
            onChange={e => setToToken(TOKENS.find(t => t.symbol === e.target.value)!)}
          >
            {TOKENS.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <button className="btn btn-primary w-full font-semibold py-2" type="button" onClick={handleSubmit}>
        立即兌換
      </button>
    </form>
  );
}