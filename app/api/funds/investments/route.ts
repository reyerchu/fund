import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/mock-database';

// GET /api/funds/investments - 獲取投資記錄
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fundId = searchParams.get('fundId');
    const investor = searchParams.get('investor');
    const summary = searchParams.get('summary');

    const database = getDatabase();

    // 如果請求投資總結
    if (summary !== null && fundId && investor) {
      const investmentSummary = database.getUserInvestmentSummary(fundId, investor);
      return NextResponse.json({ success: true, data: investmentSummary });
    }

    // 如果指定了基金 ID 和投資者地址
    if (fundId && investor) {
      const investments = database.getUserFundInvestmentHistory(fundId, investor);
      return NextResponse.json({ success: true, data: investments });
    }

    // 如果只指定了基金 ID
    if (fundId) {
      const investments = database.getFundInvestmentHistory(fundId);
      return NextResponse.json({ success: true, data: investments });
    }

    // 如果沒有指定參數，返回錯誤
    return NextResponse.json(
      { success: false, error: '請指定 fundId 參數' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/funds/investments - 記錄投資操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fundId,
      investorAddress,
      type,
      amount,
      shares,
      sharePrice,
      txHash
    } = body;

    // 驗證必要欄位
    if (!fundId || !investorAddress || !type || !amount || !shares || !sharePrice || !txHash) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 驗證 type 值
    if (type !== 'deposit' && type !== 'redeem') {
      return NextResponse.json(
        { success: false, error: 'type 必須是 deposit 或 redeem' },
        { status: 400 }
      );
    }

    const database = getDatabase();
    const investment = database.recordInvestment({
      fundId,
      investorAddress,
      type,
      amount,
      shares,
      sharePrice,
      txHash
    });

    return NextResponse.json({ success: true, data: investment }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
