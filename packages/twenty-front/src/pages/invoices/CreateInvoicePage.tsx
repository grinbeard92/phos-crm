import { useNavigate, useSearchParams } from 'react-router-dom';
import { InvoiceForm } from '@/invoices/components/InvoiceForm';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const companyId = searchParams.get('companyId');
  const contactId = searchParams.get('contactId');
  const projectId = searchParams.get('projectId');
  const quoteId = searchParams.get('quoteId');

  const handleCancel = () => {
    navigate('/objects/invoices');
  };

  const handleSuccess = (invoiceId: string) => {
    navigate(`/object/invoice/${invoiceId}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={quoteId ? 'Create Invoice from Quote' : 'Create Invoice'}
      />
      <InvoiceForm
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        initialCompanyId={companyId || undefined}
        initialContactId={contactId || undefined}
        initialProjectId={projectId || undefined}
        initialQuoteId={quoteId || undefined}
      />
    </PageContainer>
  );
};
