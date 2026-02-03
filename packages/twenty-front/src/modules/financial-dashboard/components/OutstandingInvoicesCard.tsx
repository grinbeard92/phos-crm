import styled from '@emotion/styled';
import { H2Title } from 'twenty-ui/display';
import { useNavigate } from 'react-router-dom';

type OutstandingInvoice = {
  id: string;
  invoiceNumber: string;
  companyName: string;
  balanceDue: number;
  dueDate: string;
};

type OutstandingInvoicesCardProps = {
  invoices: OutstandingInvoice[];
  currencyCode?: string;
};

const StyledCard = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(4)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledInvoiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledInvoiceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.background.transparent.lighter};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.background.transparent.light};
  }
`;

const StyledInvoiceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledInvoiceNumber = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledCompanyName = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

const StyledInvoiceRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledAmount = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const StyledDueDate = styled.div<{ isOverdue: boolean }>`
  color: ${({ theme, isOverdue }) =>
    isOverdue ? theme.color.red : theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledEmptyState = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledSummary = styled.div`
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledSummaryLabel = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledSummaryValue = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date();
};

export const OutstandingInvoicesCard = ({
  invoices,
  currencyCode = 'USD',
}: OutstandingInvoicesCardProps) => {
  const navigate = useNavigate();

  const totalOutstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.balanceDue,
    0,
  );

  // Sort by due date (overdue first, then by date)
  const sortedInvoices = [...invoices].sort((a, b) => {
    const aOverdue = isOverdue(a.dueDate);
    const bOverdue = isOverdue(b.dueDate);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/object/invoice/${invoiceId}`);
  };

  return (
    <StyledCard>
      <H2Title title="Outstanding Invoices" />

      {sortedInvoices.length === 0 ? (
        <StyledEmptyState>All invoices are paid!</StyledEmptyState>
      ) : (
        <>
          <StyledInvoiceList>
            {sortedInvoices.slice(0, 5).map((invoice) => (
              <StyledInvoiceRow
                key={invoice.id}
                onClick={() => handleInvoiceClick(invoice.id)}
              >
                <StyledInvoiceInfo>
                  <StyledInvoiceNumber>
                    {invoice.invoiceNumber}
                  </StyledInvoiceNumber>
                  <StyledCompanyName>{invoice.companyName}</StyledCompanyName>
                </StyledInvoiceInfo>
                <StyledInvoiceRight>
                  <StyledAmount>
                    {formatCurrency(invoice.balanceDue, currencyCode)}
                  </StyledAmount>
                  <StyledDueDate isOverdue={isOverdue(invoice.dueDate)}>
                    Due {formatDate(invoice.dueDate)}
                  </StyledDueDate>
                </StyledInvoiceRight>
              </StyledInvoiceRow>
            ))}
          </StyledInvoiceList>

          <StyledSummary>
            <StyledSummaryLabel>Total Outstanding</StyledSummaryLabel>
            <StyledSummaryValue>
              {formatCurrency(totalOutstanding, currencyCode)}
            </StyledSummaryValue>
          </StyledSummary>
        </>
      )}
    </StyledCard>
  );
};
