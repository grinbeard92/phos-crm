import { useNavigate } from 'react-router-dom';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';

export const useOpenCreateInvoiceDrawer = () => {
  const navigate = useNavigate();

  const openCreateInvoice = ({
    targetRecord,
  }: {
    targetRecord: TargetRecordIdentifier;
  }) => {
    const searchParams = new URLSearchParams();

    if (targetRecord.targetObjectNameSingular === 'company') {
      searchParams.set('companyId', targetRecord.id);
    } else if (targetRecord.targetObjectNameSingular === 'person') {
      searchParams.set('personId', targetRecord.id);
    } else if (targetRecord.targetObjectNameSingular === 'opportunity') {
      searchParams.set('opportunityId', targetRecord.id);
    }

    navigate(`/objects/invoices?${searchParams.toString()}`);
  };

  return openCreateInvoice;
};
