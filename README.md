# Fund Factory - 區塊鏈基金管理平台

一個基於以太坊的去中心化基金管理平台，讓基金經理人可以創建和管理基金，投資者可以進行申購和贖回操作。

## 項目來源

此項目是從 [Arlen73/on-chain-fund](https://github.com/Arlen73/on-chain-fund) 分叉而來，而該項目最初是從 [Enzyme Finance](https://enzyme.finance/) 相關項目分叉的。本項目在此基礎上進行了以下改進：

- 完整的 Apache 服務器部署配置
- SSL 證書自動配置
- 零停機時間部署腳本
- 多主機配置支持
- 生產環境優化

**原始項目**: [johnnylin9708/on-chain-fund](https://github.com/johnnylin9708/on-chain-fund)  
**中間分叉**: [Arlen73/on-chain-fund](https://github.com/Arlen73/on-chain-fund)  
**基於**: [Enzyme Finance](https://enzyme.finance/) Protocol

## 功能特色

### 🏛️ 基金經理人功能
- **創建基金**: 透過智能合約創建新的投資基金
- **管理儀表板**: 查看所有基金的表現和投資者數據
- **資產管理**: 管理基金投資組合和策略
- **費用設定**: 設定管理費和績效費

### 👤 投資者功能
- **探索基金**: 瀏覽所有可投資的基金
- **投資組合**: 查看個人投資組合表現
- **申購基金**: 使用 USDC/ASVT/WETH 投資基金
- **贖回操作**: 贖回基金份額

### 🔧 技術特色
- **智能合約集成**: 與 Enzyme Protocol 智能合約交互
- **多鏈支持**: 支持以太坊測試網 (Sepolia)
- **響應式設計**: 適配桌面端和移動端
- **即時數據**: 實時顯示基金淨值和表現

## 技術棧

- **前端**: Next.js 14, React 18, TypeScript
- **樣式**: Tailwind CSS  
- **區塊鏈**: Ethers.js v6, 自定義 Web3 Provider
- **智能合約**: Enzyme Protocol (Fund Factory, Vault, Comptroller)

## 重要更新

### 錢包連接
現在使用自定義的 Web3 Provider：
```typescript
// lib/web3-context.tsx
- 支持 MetaMask 錢包連接/斷開
- 自動網絡切換到 Sepolia
- 帳戶狀態管理
- 錯誤處理和重連機制
```

## 合約地址 (Sepolia 測試網)

```typescript
FUND_FACTORY_ADDRESS = '0x9D2C19a267caDA33da70d74aaBF9d2f75D3CdC14'

TOKEN_ADDRESSES = {
  ASVT: '0x932b08d5553b7431FB579cF27565c7Cd2d4b8fE0',
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
}
```

## 開始使用

### 先決條件
- Node.js 18+
- MetaMask 錢包
- Sepolia 測試網代幣

### 安裝步驟

1. 克隆倉庫
```bash
git clone [repository-url]
cd on-chain-fund-platform
```

2. 安裝依賴
```bash
npm install
```

3. 啟動開發服務器
```bash
npm run dev
```

4. 打開瀏覽器訪問 `http://localhost:3000`

### 連接錢包
1. 確保 MetaMask 已安裝並設定為 Sepolia 測試網
2. 點擊「連接錢包」按鈕
3. 授權應用訪問您的錢包

## 頁面結構

```
/                   # 首頁 - 選擇投資者或經理人入口
/investor           # 投資者儀表板 - 查看投資組合
/manager            # 基金經理儀表板 - 管理基金
/manager/create     # 創建新基金
/fund/[id]          # 基金詳情頁 - 申購和贖回
```

## 智能合約交互

### 創建基金
```typescript
await fundFactory.createNewFund(
  fundOwner,
  fundName, 
  fundSymbol,
  denominationAsset,
  sharesActionTimelock,
  feeManagerConfigData,
  policyManagerConfigData
)
```

### 申購基金份額
```typescript
await comptroller.buyShares(
  investmentAmount,
  minSharesQuantity
)
```

### 贖回基金份額
```typescript
await comptroller.redeemSharesInKind(
  receiver,
  shareQuantity,
  assetsToRedeem,
  assetReceivers
)
```

## 開發說明

### 項目結構
```
├── app/                 # Next.js App Router 頁面
├── components/          # React 組件
├── lib/                 # 工具函數和合約配置
├── types/              # TypeScript 類型定義
└── public/             # 靜態資源
```

### 主要組件
- `Navigation` - 導航欄和錢包連接
- `HeroSection` - 首頁入口選擇
- `InvestorDashboard` - 投資者儀表板
- `ManagerDashboard` - 基金經理儀表板  
- `CreateFundForm` - 創建基金表單
- `FundDetails` - 基金詳情和申購界面

### 狀態管理
- 使用 React Hooks (useState, useEffect) 管理組件狀態
- 可考慮整合 Zustand 或 Redux 進行全局狀態管理

## 部署

### 構建生產版本
```bash
npm run build
```

### 啟動生產服務器
```bash
npm start
```

## 安全注意事項

- 所有交易都需要用戶確認
- 合約地址和 ABI 需要驗證
- 建議在主網使用前進行充分測試
- 實施適當的錯誤處理和用戶反饋

## 許可證

MIT License

## 貢獻

歡迎提交 Issues 和 Pull Requests！

## 聯繫

如有問題，請聯繫開發團隊。
