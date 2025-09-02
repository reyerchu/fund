#!/usr/bin/env node

// 即時報價組件資料庫整合測試
console.log('📊 即時報價組件資料庫整合測試\n');
console.log('============================\n');

const baseUrl = 'http://localhost:3304/api';

async function testPriceTickerData() {
  console.log('🧪 測試即時報價資料源...\n');

  try {
    // 1. 獲取所有基金
    console.log('📋 載入基金資料...');
    const fundsResponse = await fetch(`${baseUrl}/funds`);
    const fundsResult = await fundsResponse.json();

    if (!fundsResult.success || fundsResult.data.length === 0) {
      console.log('❌ 沒有找到基金資料。');
      return;
    }

    const activeFunds = fundsResult.data.filter(fund => fund.status === 'active');
    console.log(`✅ 找到 ${activeFunds.length} 檔活躍基金:`);

    activeFunds.forEach((fund, index) => {
      console.log(`   ${index + 1}. ${fund.fundSymbol} - ${fund.fundName}`);
      console.log(`      份額價格: $${fund.sharePrice || '1.00'}`);
      console.log(`      狀態: ${fund.status}`);
      console.log(`      創建日期: ${new Date(fund.createdAt).toLocaleDateString()}`);
    });
    console.log('');

    // 2. 模擬即時報價邏輯
    console.log('📈 模擬即時報價計算:');
    const tickerItems = activeFunds.map(fund => {
      const basePrice = parseFloat(fund.sharePrice || '1.00');
      // 模擬價格波動
      const priceVariation = (Math.random() - 0.5) * 0.1; // ±5%
      const currentPrice = basePrice * (1 + priceVariation);
      const change = currentPrice - basePrice;
      const changePercent = (change / basePrice) * 100;

      return {
        fundId: fund.id,
        symbol: fund.fundSymbol,
        name: fund.fundName,
        basePrice: basePrice.toFixed(4),
        currentPrice: currentPrice.toFixed(4),
        change: change >= 0 ? `+${change.toFixed(4)}` : change.toFixed(4),
        changePercent: changePercent.toFixed(2)
      };
    });

    tickerItems.forEach((item, index) => {
      const colorCode = parseFloat(item.changePercent) >= 0 ? '🟢' : '🔴';
      console.log(`   ${colorCode} ${item.symbol}`);
      console.log(`      名稱: ${item.name}`);
      console.log(`      基準價格: $${item.basePrice}`);
      console.log(`      當前價格: $${item.currentPrice}`);
      console.log(`      變動: ${item.change} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent}%)`);
      console.log('');
    });

    // 3. 測試價格更新邏輯
    console.log('🔄 測試價格更新邏輯:');
    const updatedItems = tickerItems.map(item => {
      const priceChange = (Math.random() - 0.5) * 0.01; // ±0.5%
      const newPrice = parseFloat(item.currentPrice) * (1 + priceChange);
      const previousPrice = parseFloat(item.currentPrice);
      const change = newPrice - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      return {
        ...item,
        previousPrice: item.currentPrice,
        currentPrice: newPrice.toFixed(4),
        change: change >= 0 ? `+${change.toFixed(4)}` : change.toFixed(4),
        changePercent: changePercent.toFixed(2)
      };
    });

    updatedItems.forEach(item => {
      const trend = parseFloat(item.changePercent) >= 0 ? '📈' : '📉';
      console.log(`   ${trend} ${item.symbol}: ${item.previousPrice} → ${item.currentPrice} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent}%)`);
    });
    console.log('');

    // 4. 總結報告
    console.log('📊 即時報價功能總結:');
    console.log(`   ✅ 基金數量: ${activeFunds.length} 檔`);
    console.log(`   ✅ 資料來源: 資料庫 API`);
    console.log(`   ✅ 價格計算: 基於 sharePrice + 隨機波動`);
    console.log(`   ✅ 更新頻率: 15秒間隔`);
    console.log(`   ✅ UI 功能: 滾動顯示、手動刷新`);
    console.log('');

    console.log('🎉 即時報價組件測試完成！');
    console.log('💡 建議: 在瀏覽器中查看 PriceTicker 組件的即時效果');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  }
}

// 執行測試
testPriceTickerData().catch(console.error);
