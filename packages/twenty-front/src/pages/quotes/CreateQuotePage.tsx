import { useNavigate, useSearchParams } from 'react-router-dom';
import { QuoteForm } from '@/quotes/components/QuoteForm';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';

export const CreateQuotePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const companyId = searchParams.get('companyId');
  const contactId = searchParams.get('contactId');
  const projectId = searchParams.get('projectId');

  const handleCancel = () => {
    navigate('/objects/quotes');
  };

  const handleSuccess = (quoteId: string) => {
    navigate(`/object/quote/${quoteId}`);
  };

  return (
    <PageContainer>
      <PageHeader title="Create Quote" />
      <QuoteForm
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        initialCompanyId={companyId || undefined}
        initialContactId={contactId || undefined}
        initialProjectId={projectId || undefined}
      />
    </PageContainer>
  );
};
