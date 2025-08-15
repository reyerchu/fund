'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-b from-primary-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Fund Factory</h1>
          <p className="text-xl text-gray-600 mb-8">在區塊鏈上建立、管理和投資基金。</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 投資人卡片 */}
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">投資人</h2>
            <p className="text-gray-600 mb-8">
              探索基金、追蹤您的投資組合並增加您的資產。
            </p>
            <Link 
              href="/investor" 
              className="inline-block w-full bg-success-500 hover:bg-success-600 text-white font-medium py-4 px-8 rounded-xl transition-colors"
            >
              前往投資人儀表板
            </Link>
          </div>

          {/* 基金經理人卡片 */}
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">基金經理人</h2>
            <p className="text-gray-600 mb-8">
              創建您的基金、定義策略，並運用強大的工具來管理資產。
            </p>
            <Link 
              href="/manager" 
              className="inline-block w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-8 rounded-xl transition-colors"
            >
              前往經理人儀表板
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
