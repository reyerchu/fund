const fs = require('fs');
const path = require('path');

// Load funds.json database
const fundsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'funds.json'), 'utf8'));

async function testDashboardCalculation() {
  console.log('🧮 測試投資人儀表板計算邏輯...\n');
  
  const investorAddress = '0x1cF1fb97E6A4AfaA4167FA19d52AD19D6689C677';
  
  // Get all funds
  const allFunds = fundsData.funds || [];
  const allInvestments = fundsData.investments || [];
  
  console.log(`📋 找到 ${allFunds.length} 個基金, ${allInvestments.length} 筆投資記錄`);
  
  let portfolioItems = [];
  let totalCurrentValue = 0;
  let totalDeposited = 0;
  let totalRedeemed = 0;
  
  console.log('\n📊 各基金投資計算:');
  
  for (const fund of allFunds) {
    // Get investments for this fund and investor
    const fundInvestments = allInvestments.filter(inv => 
      inv.fundId === fund.id && inv.investorAddress.toLowerCase() === investorAddress.toLowerCase()
    );
    
    if (fundInvestments.length === 0) continue;
    
    // Calculate totals
    const deposits = fundInvestments.filter(inv => inv.type === 'deposit');
    const redeems = fundInvestments.filter(inv => inv.type === 'redeem');
    
    const fundTotalDeposited = deposits.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const fundTotalRedeemed = redeems.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const fundCurrentShares = deposits.reduce((sum, inv) => sum + parseFloat(inv.shares), 0) - 
                              redeems.reduce((sum, inv) => sum + parseFloat(inv.shares), 0);
    
    if (fundCurrentShares <= 0) continue; // Skip if no shares
    
    const sharePrice = parseFloat(fund.sharePrice || '1.00');
    const currentValue = fundCurrentShares * sharePrice;
    const netInvestment = fundTotalDeposited - fundTotalRedeemed;
    const fundReturn = currentValue - netInvestment;
    const returnPercentage = netInvestment > 0 ? (fundReturn / netInvestment) * 100 : 0;
    
    console.log(`  ${fund.fundSymbol} (${fund.fundName}):`);
    console.log(`    總投入: $${fundTotalDeposited.toFixed(2)}`);
    console.log(`    總贖回: $${fundTotalRedeemed.toFixed(2)}`);
    console.log(`    淨投入: $${netInvestment.toFixed(2)}`);
    console.log(`    持有份額: ${fundCurrentShares.toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6})}`);
    console.log(`    份額價格: $${sharePrice.toFixed(4)}`);
    console.log(`    當前價值: $${currentValue.toFixed(2)}`);
    console.log(`    收益: $${fundReturn.toFixed(2)} (${returnPercentage.toFixed(2)}%)\n`);
    
    portfolioItems.push({
      fund: fund,
      totalDeposited: fundTotalDeposited,
      totalRedeemed: fundTotalRedeemed,
      currentShares: fundCurrentShares,
      currentValue: currentValue,
      returnPercentage: returnPercentage
    });
    
    totalCurrentValue += currentValue;
    totalDeposited += fundTotalDeposited;
    totalRedeemed += fundTotalRedeemed;
  }
  
  // Calculate portfolio summary using the same logic as the component
  const netInvestment = totalDeposited - totalRedeemed;
  const totalReturn = totalCurrentValue - netInvestment;
  const overallReturnPercentage = netInvestment > 0 ? (totalReturn / netInvestment) * 100 : 0;
  
  // Find best performer
  let bestPerformer = null;
  let bestPerformanceValue = -Infinity;
  portfolioItems.forEach(item => {
    if (item.returnPercentage > bestPerformanceValue) {
      bestPerformanceValue = item.returnPercentage;
      bestPerformer = {
        symbol: item.fund.fundSymbol,
        performance: `${item.returnPercentage >= 0 ? '+' : ''}${item.returnPercentage.toFixed(2)}%`
      };
    }
  });
  
  console.log('📈 投資組合總結 (修正後的計算邏輯):');
  console.log(`  總投入金額: $${totalDeposited.toFixed(2)}`);
  console.log(`  總贖回金額: $${totalRedeemed.toFixed(2)}`);
  console.log(`  淨投入金額: $${netInvestment.toFixed(2)} (投入 - 贖回)`);
  console.log(`  當前總價值: $${totalCurrentValue.toFixed(2)}`);
  console.log(`  總收益: $${totalReturn.toFixed(2)} (${overallReturnPercentage.toFixed(2)}%)`);
  console.log(`  持有基金數: ${portfolioItems.length}`);
  console.log(`  最佳表現: ${bestPerformer ? `${bestPerformer.symbol} (${bestPerformer.performance})` : 'N/A'}`);
  
  console.log('\n✅ 計算邏輯驗證:');
  console.log(`   收益 = 當前價值 - 淨投入`);
  console.log(`   $${totalReturn.toFixed(2)} = $${totalCurrentValue.toFixed(2)} - $${netInvestment.toFixed(2)}`);
  console.log(`   收益率 = 收益 / 淨投入 * 100%`);
  console.log(`   ${overallReturnPercentage.toFixed(2)}% = $${totalReturn.toFixed(2)} / $${netInvestment.toFixed(2)} * 100%`);
  
  console.log('\n🎯 這個計算邏輯確保了:');
  console.log('   1. 贖回的金額不會被重複計算為"投資"');
  console.log('   2. 收益計算基於實際的淨投入(投入-贖回)');
  console.log('   3. 收益率反映真實的投資回報');
}

testDashboardCalculation().catch(console.error);
