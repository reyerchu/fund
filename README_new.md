# 🚀 Fund Factory - 去中心化基金管理平台

一個完整的區塊鏈基金管理平台，支持基金創建、投資、贖回和管理。建構在 Ethereum Sepolia 測試網上，整合 Enzyme Protocol 智能合約。

![Fund Factory](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan?logo=tailwindcss)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple?logo=ethereum)

## ✨ 主要功能

### 投資人功能
- 🔍 **基金探索** - 瀏覽和篩選可用基金
- 💰 **投資申購** - 購買基金份額
- 📊 **投資組合** - 查看持倉和績效
- 💸 **贖回份額** - 贖回投資並獲得收益
- 📈 **實時績效** - 追蹤投資表現

### 基金經理功能
- 🏗️ **基金創建** - 通過直觀的多步驟流程創建基金
- 💼 **資產管理** - 管理基金投資組合
- 📈 **績效追蹤** - 監控基金表現和投資者活動
- 🔄 **交易執行** - 買賣基金資產
- ⚙️ **基金設定** - 調整費用和策略

### 技術特色
- 🌐 **Web3 整合** - MetaMask 錢包連接
- 🔗 **區塊鏈互動** - 與 Enzyme Protocol 合約互動
- 💎 **現代化 UI** - 響應式設計，支持深色模式
- 🚀 **高性能** - Next.js 14 App Router
- 🔒 **型別安全** - 完整的 TypeScript 支持

## 🛠️ 技術架構

```
├── app/                    # Next.js 13+ App Router
│   ├── explore/           # 基金探索頁面
│   ├── fund/[id]/         # 基金詳情頁面
│   ├── investor/          # 投資人儀表板
│   ├── manager/           # 經理人儀表板
│   └── layout.tsx         # 根布局與 Web3 提供者
├── components/            # React 組件
│   ├── Navigation.tsx     # 導航欄與錢包連接
│   ├── CreateFundForm.tsx # 基金創建表單
│   ├── FundDetails.tsx    # 基金詳情與投資
│   ├── ExploreFunds.tsx   # 基金探索列表
│   └── ui/               # UI 組件庫
├── lib/                   # 核心邏輯
│   ├── contracts.ts      # 智能合約 ABI 和地址
│   ├── fund-service.ts   # 基金服務類
│   └── wagmi.ts          # Web3 配置
└── types/                # TypeScript 類型定義
```

## 🚀 快速開始

### 前置條件

- Node.js 18+ 
- npm 或 yarn
- MetaMask 瀏覽器擴展
- Sepolia 測試網 ETH（從 [水龍頭](https://sepoliafaucet.com/) 獲得）

### 安裝步驟

1. **克隆專案**
```bash
git clone <your-repo-url>
cd on-chain-fund
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動開發服務器**
```bash
npm run dev
```

4. **打開應用**
   - 打開 http://localhost:3304
   - 連接 MetaMask 錢包
   - 切換到 Sepolia 測試網

## 🔗 智能合約地址 (Sepolia)

| 合約 | 地址 | 用途 |
|------|------|------|
| Fund Factory | `0x9D2C19a267caDA33da70d74aaBF9d2f75D3CdC14` | 基金創建 |
| ASVT Token | `0x932b08d5553b7431FB579cF27565c7Cd2d4b8fE0` | 默認計價資產 |
| USDC (測試) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 穩定幣資產 |
| WETH (測試) | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` | 包裝以太幣 |

## 🎯 使用指南

### 作為投資人

1. **連接錢包**
   - 點擊右上角「連接錢包」按鈕
   - 選擇 MetaMask 並授權連接

2. **探索基金**
   - 前往「探索基金」頁面
   - 使用篩選器找到感興趣的基金
   - 查看基金績效、策略和風險等級

3. **投資基金**
   - 點擊基金卡片的「查看詳情」
   - 在投資面板輸入投資金額
   - 首次投資需要授權代幣使用權限
   - 確認交易並等待區塊鏈確認

4. **管理投資組合**
   - 在「投資人儀表板」查看所有持倉
   - 追蹤投資績效和收益
   - 隨時申購更多份額或贖回投資

### 作為基金經理

1. **創建基金**
   - 前往「經理人儀表板」
   - 點擊「創建新基金」按鈕
   - 完成三步驟設定流程：
     - 基礎資訊（名稱、代號、計價資產）
     - 費用設定（管理費、績效費）
     - 確認創建

2. **管理基金**
   - 在管理面板查看基金概況
   - 監控資產配置和投資人活動
   - 執行基金資產的買賣交易
   - 查看詳細的績效報告

## 🔧 開發指南

### 項目結構

- **`app/`** - Next.js App Router 頁面
- **`components/`** - 可重用的 React 組件
- **`lib/`** - 核心業務邏輯和工具函數
- **`types/`** - TypeScript 類型定義

### 主要依賴

- **Next.js 14** - React 框架
- **TypeScript** - 型別安全
- **Tailwind CSS** - 樣式框架
- **Wagmi** - React Hooks for Ethereum
- **RainbowKit** - 錢包連接 UI
- **Ethers.js** - 以太坊互動庫

### 環境配置

創建 `.env.local` 文件：

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
```

### 建置和部署

```bash
# 建置生產版本
npm run build

# 啟動生產服務器
npm start

# 型別檢查
npm run type-check

# 代碼格式檢查
npm run lint
```

## 📱 響應式設計

應用完全支援響應式設計，在以下設備上都能完美運行：

- 📱 手機 (320px+)
- 📱 平板 (768px+) 
- 💻 桌面 (1024px+)
- 🖥️ 大屏幕 (1280px+)

## 🔒 安全考慮

- ✅ 合約地址和 ABI 驗證
- ✅ 交易前確認和驗證
- ✅ 用戶輸入驗證和清理
- ✅ 錯誤處理和用戶反饋
- ✅ 僅支持測試網環境

## 🐛 已知限制

- 目前僅支持 Sepolia 測試網
- 部分高級交易功能仍在開發中
- 績效圖表功能待實現
- 需要進一步的智能合約審計

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打開 Pull Request

## 📄 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 文件。

## 📞 聯繫方式

- **項目維護者**: Johnny Lin
- **Email**: johnny@example.com
- **GitHub**: [@johnnylin](https://github.com/johnnylin)

## 🙏 致謝

- [Enzyme Protocol](https://enzyme.finance/) - DeFi 基金管理基礎設施
- [RainbowKit](https://rainbowkit.com/) - Web3 錢包連接
- [Wagmi](https://wagmi.sh/) - React Hooks for Ethereum
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

**⚠️ 重要提醒**: 本應用僅用於測試和學習目的，請勿在主網上使用真實資金進行操作。

## 🎥 截圖預覽

### 主頁
- 簡潔的雙入口設計（投資人 vs 基金經理）
- 現代化的漸層背景和卡片佈局

### 基金探索頁面
- 基金卡片展示關鍵資訊
- 多維度篩選和排序功能
- 響應式網格佈局

### 投資人儀表板
- 投資組合概覽和統計
- 持倉列表和績效追蹤
- 快速操作按鈕

### 基金創建流程
- 三步驟直觀設定流程
- 實時表單驗證
- 清楚的進度指示器

### 基金詳情頁面
- 完整的基金資訊展示
- 投資和贖回操作面板
- 實時價格和績效數據

## 🚀 部署狀態

- ✅ **開發環境**: 完成
- ✅ **本地測試**: 通過
- ⏳ **測試網部署**: 進行中
- ❌ **主網部署**: 未啟動

## 📊 專案統計

- **代碼行數**: ~3,000+ lines
- **組件數量**: 15+ React components
- **頁面數量**: 8 pages
- **支援語言**: 繁體中文
- **瀏覽器支援**: Chrome, Firefox, Safari, Edge
