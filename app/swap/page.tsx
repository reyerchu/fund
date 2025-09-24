import SwapForm from '@/components/SwapForm';
import Navigation from '../../components/Navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SwapPage() {
  return (
    <>
      <Navigation />
      <div className="max-w-lg mx-auto mt-10 card">
        <h2 className="text-xl font-bold mb-4">Uniswap 兌換介面</h2>
        <SwapForm />
      </div>
    </>
  );
}