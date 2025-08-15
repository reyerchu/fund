#!/usr/bin/env node

// 代幣小數位數問題修正報告
console.log('🔧 代幣小數位數問題修正報告\n');
console.log('=============================\n');

const { ethers } = require('ethers');

console.log('📊 問題分析:\n');

console.log('原始問題:');
console.log('❌ USDC 使用 6 位小數，但代碼使用 ethers.parseEther (18 位小數)');
console.log('❌ 餘額顯示 10 USDC，但投資 1 USDC 時出現餘額不足');
console.log('❌ 授權和投資使用不同的小數位數解析');
console.log('');

console.log('🔍 小數位數對比:\n');

console.log('ETH/WETH: 18 位小數');
console.log('USDC: 6 位小數');
console.log('USDT: 6 位小數');
console.log('DAI: 18 位小數');
console.log('');

console.log('錯誤示例:');
const amount = '1.0';
console.log(`金額: ${amount}`);

try {
  const etherParsed = ethers.parseEther(amount);
  const usdcParsed = ethers.parseUnits(amount, 6);
  
  console.log(`ethers.parseEther("1.0"): ${etherParsed.toString()}`);
  console.log(`ethers.parseUnits("1.0", 6): ${usdcParsed.toString()}`);
  console.log(`差異倍數: ${(etherParsed / usdcParsed).toString()}`);
} catch (error) {
  console.log(`錯誤: ${error.message}`);
}
console.log('');

console.log('🔧 已實施的修正:\n');

console.log('1. FundService 修正:');
console.log('   ✅ buyShares: 獲取計價資產小數位數，使用 parseUnits');
console.log('   ✅ approveToken: 獲取代幣小數位數，使用 parseUnits');
console.log('   ✅ 保持 getTokenBalance/getAllowance 使用正確小數');
console.log('');

console.log('2. FundDetails 修正:');
console.log('   ✅ 添加 tokenDecimals state 追踪小數位數');
console.log('   ✅ loadUserData 中獲取代幣小數位數');
console.log('   ✅ 所有比較邏輯使用 parseUnits 而非 parseEther');
console.log('   ✅ UI 中顯示小數位數信息幫助調試');
console.log('');

console.log('3. 調試功能增強:');
console.log('   ✅ 控制台輸出小數位數信息');
console.log('   ✅ buyShares 和 approveToken 輸出詳細參數');
console.log('   ✅ UI 中顯示代幣小數位數');
console.log('');

console.log('📝 修正前後對比:\n');

console.log('修正前 (錯誤):');
console.log('- 授權: ethers.parseEther("1") = 1000000000000000000');
console.log('- 投資: ethers.parseEther("1") = 1000000000000000000');
console.log('- 但 USDC 餘額: 1000000 (6 位小數)');
console.log('- 結果: 1000000000000000000 > 1000000 = 餘額不足');
console.log('');

console.log('修正後 (正確):');
console.log('- 授權: ethers.parseUnits("1", 6) = 1000000');
console.log('- 投資: ethers.parseUnits("1", 6) = 1000000');
console.log('- USDC 餘額: 10000000 (10 USDC)');
console.log('- 結果: 1000000 < 10000000 = 餘額充足');
console.log('');

console.log('🎯 解決方案效果:\n');

console.log('現在的流程:');
console.log('1. 載入基金時獲取計價資產小數位數');
console.log('2. 授權時使用正確小數位數');
console.log('3. 投資時使用正確小數位數');
console.log('4. 比較邏輯統一使用正確小數位數');
console.log('5. UI 顯示調試信息');
console.log('');

console.log('🚀 測試建議:\n');

console.log('1. 檢查控制台輸出:');
console.log('   - "Token decimals loaded: 6" (USDC)');
console.log('   - "approveToken params" 中的 decimals');
console.log('   - "buyShares params" 中的 decimals');
console.log('');

console.log('2. 驗證 UI 顯示:');
console.log('   - 投資預覽區應顯示 "代幣小數位數: 6"');
console.log('   - 餘額充足時不應顯示紅色警告');
console.log('');

console.log('3. 測試不同金額:');
console.log('   - 1 USDC (應該成功)');
console.log('   - 0.1 USDC (測試小數處理)');
console.log('   - 超過餘額的金額 (應顯示警告)');
console.log('');

console.log('💡 現在您的 10 USDC 餘額應該可以成功投資 1 USDC 了！');
console.log('🎉 小數位數精度問題已完全解決！');
