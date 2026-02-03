import styled from '@emotion/styled';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { InvoicePaymentSection } from './InvoicePaymentSection';

const StyledPaymentsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(4)};
`;

export const PaymentsCard = () => {
  const targetRecord = useTargetRecord();

  const { record: invoice, loading } = useFindOneRecord({
    objectNameSingular: 'invoice',
    objectRecordId: targetRecord.id,
  });

  if (loading) {
    return (
      <StyledPaymentsContainer>
        <SkeletonLoader />
      </StyledPaymentsContainer>
    );
  }

  if (!invoice) {
    return (
      <StyledPaymentsContainer>
        <div>Invoice not found</div>
      </StyledPaymentsContainer>
    );
  }

  return (
    <StyledPaymentsContainer>
      <InvoicePaymentSection invoice={invoice} />
    </StyledPaymentsContainer>
  );
};
