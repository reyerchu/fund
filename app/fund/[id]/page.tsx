import Navigation from '../../../components/Navigation';
import FundDetails from '../../../components/FundDetails';

export default function FundPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Navigation />
      <FundDetails fundId={params.id} />
    </>
  );
}
