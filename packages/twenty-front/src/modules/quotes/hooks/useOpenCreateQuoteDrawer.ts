import { useNavigate } from 'react-router-dom';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';

export const useOpenCreateQuoteDrawer = () => {
  const navigate = useNavigate();

  const openCreateQuote = ({
    targetRecord,
  }: {
    targetRecord: TargetRecordIdentifier;
  }) => {
    // Navigate to quotes list with creation intent
    // Pre-fill with target record relationship
    const searchParams = new URLSearchParams();

    if (targetRecord.targetObjectNameSingular === 'company') {
      searchParams.set('companyId', targetRecord.id);
    } else if (targetRecord.targetObjectNameSingular === 'person') {
      searchParams.set('personId', targetRecord.id);
    } else if (targetRecord.targetObjectNameSingular === 'opportunity') {
      searchParams.set('opportunityId', targetRecord.id);
    }

    navigate(`/objects/quotes?${searchParams.toString()}`);
  };

  return openCreateQuote;
};
