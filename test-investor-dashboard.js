// 測試投資人儀表板API功能
const baseUrl = 'http://localhost:3000/api';

// 測試用戶地址
const testInvestor = '0x1cF1fb97E6A4AfaA4167FA19d52AD19D6689C677';

async function testInvestorDashboard() {
  console.log('🧪 測試投資人儀表板數據...\n');

  try {
    // 1. 獲取所有基金
    console.log('📋 獲取所有基金...');
    const fundsResponse = await fetch(`${baseUrl}/funds`);
    const fundsResult = await fundsResponse.json();
    
    if (!fundsResult.success || fundsResult.data.length === 0) {
      console.log('❌ 沒有找到基金數據，請先創建一些測試基金');
      return;
    }
    
    console.log(`✅ 找到 ${fundsResult.data.length} 個基金`);
    
    // 2. 為每個基金創建一些測試投資記錄
    for (let i = 0; i < Math.min(2, fundsResult.data.length); i++) {
      const fund = fundsResult.data[i];
      console.log(`\n💰 為基金 "${fund.fundName}" 創建測試投資記錄...`);
      
      // 創建存款記錄
      const depositData = {
        fundId: fund.id,
        investorAddress: testInvestor,
        type: 'deposit',
        amount: (1000 + i * 500).toString(),
        shares: (1000 + i * 500).toString(),
        sharePrice: '1.00',
        txHash: `0xDeposit${fund.id}${i}Hash123456789012345678901234567890`
      };
      
      const depositResponse = await fetch(`${baseUrl}/funds/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData)
      });
      
      const depositResult = await depositResponse.json();
      if (depositResult.success) {
        console.log(`  ✅ 存款記錄: $${depositData.amount}`);
      } else {
        console.log(`  ❌ 存款記錄失敗: ${depositResult.error}`);
      }
      
      // 如果是第二個基金，也創建一筆贖回記錄
      if (i === 1) {
        const redeemData = {
          fundId: fund.id,
          investorAddress: testInvestor,
          type: 'redeem',
          amount: '200',
          shares: '200',
          sharePrice: '1.05',
          txHash: `0xRedeem${fund.id}Hash123456789012345678901234567890`
        };
        
        const redeemResponse = await fetch(`${baseUrl}/funds/investments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(redeemData)
        });
        
        const redeemResult = await redeemResponse.json();
        if (redeemResult.success) {
          console.log(`  ✅ 贖回記錄: $${redeemData.amount}`);
        } else {
          console.log(`  ❌ 贖回記錄失敗: ${redeemResult.error}`);
        }
      }
    }
    
    // 3. 獲取用戶的投資總結
    console.log(`\n📊 獲取用戶 ${testInvestor} 的投資總結...\n`);
    
    const portfolioData = [];
    
    for (const fund of fundsResult.data) {
      const summaryUrl = `${baseUrl}/funds/investments/summary?fundId=${fund.id}&investor=${testInvestor}`;
      const summaryResponse = await fetch(summaryUrl);
      const summaryResult = await summaryResponse.json();
      
      if (summaryResult.success && summaryResult.data) {
        const summary = summaryResult.data;
        console.log(`💼 ${fund.fundName} (${fund.fundSymbol}):`);
        console.log(`  總投入: $${summary.totalDeposited}`);
        console.log(`  總贖回: $${summary.totalRedeemed}`);
        console.log(`  當前份額: ${summary.currentShares}`);
        console.log(`  當前價值: $${summary.currentValue}`);
        console.log(`  總收益: $${summary.totalReturn} (${summary.returnPercentage}%)`);
        console.log(`  首次投資: ${new Date(summary.firstInvestmentDate).toLocaleString()}`);
        console.log('');
        
        portfolioData.push({
          fund,
          summary
        });
      }
    }
    
    // 4. 計算投資組合總結
    if (portfolioData.length > 0) {
      let totalValue = 0;
      let totalDeposited = 0;
      let bestPerformer = { symbol: '', performance: -Infinity };
      
      portfolioData.forEach(({ fund, summary }) => {
        totalValue += parseFloat(summary.currentValue);
        totalDeposited += parseFloat(summary.totalDeposited);
        
        const returnPercentage = parseFloat(summary.returnPercentage);
        if (returnPercentage > bestPerformer.performance) {
          bestPerformer = {
            symbol: fund.fundSymbol,
            performance: returnPercentage
          };
        }
      });
      
      const totalReturn = totalValue - totalDeposited;
      const overallReturnPercentage = totalDeposited > 0 ? (totalReturn / totalDeposited) * 100 : 0;
      
      console.log('📈 投資組合總結:');
      console.log(`  總價值: $${totalValue.toFixed(2)}`);
      console.log(`  總投入: $${totalDeposited.toFixed(2)}`);
      console.log(`  總收益: $${totalReturn.toFixed(2)} (${overallReturnPercentage.toFixed(2)}%)`);
      console.log(`  持有基金: ${portfolioData.length} 個`);
      console.log(`  最佳表現: ${bestPerformer.symbol} (+${bestPerformer.performance.toFixed(2)}%)`);
    } else {
      console.log('📊 用戶目前沒有任何投資記錄');
    }
    
    console.log('\n🎉 投資人儀表板測試完成！');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  }
}

// 執行測試
testInvestorDashboard().catch(console.error);
