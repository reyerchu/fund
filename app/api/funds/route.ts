import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/mock-database';

// GET /api/funds - 獲取所有基金或搜尋基金
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('search');
    const creator = searchParams.get('creator');
    const vaultAddress = searchParams.get('vault');

    const database = getDatabase();

    if (vaultAddress) {
      const fund = database.getFundByVaultAddress(vaultAddress);
      // 舊資料補上 entranceFee 欄位
      return NextResponse.json({
        success: true,
        data: fund
          ? {
              ...fund,
              entranceFeePercent: fund.entranceFeePercent ?? 0,
              entranceFeeRecipient: fund.entranceFeeRecipient ?? '',
            }
          : null,
      });
    }

    if (creator) {
      const funds = database.getFundsByCreator(creator);
      return NextResponse.json({
        success: true,
        data: funds.map((f: any) => ({
          ...f,
          entranceFeePercent: f.entranceFeePercent ?? 0,
          entranceFeeRecipient: f.entranceFeeRecipient ?? '',
        })),
      });
    }

    if (query) {
      const funds = database.searchFunds(query);
      return NextResponse.json({
        success: true,
        data: funds.map((f: any) => ({
          ...f,
          entranceFeePercent: f.entranceFeePercent ?? 0,
          entranceFeeRecipient: f.entranceFeeRecipient ?? '',
        })),
      });
    }

    const funds = database.getAllFunds();
    return NextResponse.json({
      success: true,
      data: funds.map((f: any) => ({
        ...f,
        entranceFeePercent: f.entranceFeePercent ?? 0,
        entranceFeeRecipient: f.entranceFeeRecipient ?? '',
      })),
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/funds - 創建新基金記錄
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fundName,
      fundSymbol,
      vaultProxy,
      comptrollerProxy,
      denominationAsset,
      creator,
      txHash,
      entranceFeePercent,
      entranceFeeRecipient,
    } = body;

    // 驗證必要欄位
    if (!fundName || !fundSymbol || !vaultProxy || !comptrollerProxy || !creator || !txHash) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    const database = getDatabase();
    const fund = database.createFund({
      fundName,
      fundSymbol,
      vaultProxy,
      comptrollerProxy,
      denominationAsset,
      creator,
      txHash,
      // ★ 新增：保存 entranceFee
      entranceFeePercent: Number.isFinite(Number(entranceFeePercent))
        ? Number(entranceFeePercent)
        : 0,
      entranceFeeRecipient: entranceFeeRecipient ?? '',
    });

    return NextResponse.json({ success: true, data: fund }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
