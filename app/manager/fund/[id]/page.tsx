import Navigation from '../../../../components/Navigation';
import ManagerFundDetails from '../../../../components/ManagerFundDetails';

export default function ManagerFundPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Navigation />
      <ManagerFundDetails fundId={params.id} />
    </>
  );
}
