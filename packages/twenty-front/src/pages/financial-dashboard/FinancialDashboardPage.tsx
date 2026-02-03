import styled from '@emotion/styled';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { CashFlowSummaryCard } from '@/financial-dashboard/components/CashFlowSummaryCard';
import { ExpensesByCategoryCard } from '@/financial-dashboard/components/ExpensesByCategoryCard';
import { OutstandingInvoicesCard } from '@/financial-dashboard/components/OutstandingInvoicesCard';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
`;

const StyledDashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(6)};
`;

const StyledFullWidthSection = styled.div`
  grid-column: 1 / -1;
`;

export const FinancialDashboardPage = () => {
  // Mock data - in production, fetch from GraphQL
  const mockCashFlowData = {
    totalRevenue: 125000,
    totalExpenses: 45000,
  };

  const mockExpensesByCategory = [
    { categoryName: 'Software', total: 15000, color: '#3B82F6' },
    { categoryName: 'Travel', total: 12000, color: '#10B981' },
    { categoryName: 'Office Supplies', total: 8000, color: '#F59E0B' },
    { categoryName: 'Marketing', total: 5000, color: '#EF4444' },
    { categoryName: 'Equipment', total: 3000, color: '#8B5CF6' },
    { categoryName: 'Other', total: 2000, color: '#6B7280' },
  ];

  const mockOutstandingInvoices = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      companyName: 'Acme Corp',
      balanceDue: 15000,
      dueDate: '2024-01-15',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-003',
      companyName: 'TechStart Inc',
      balanceDue: 8500,
      dueDate: '2024-02-01',
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-007',
      companyName: 'Global Solutions',
      balanceDue: 22000,
      dueDate: '2024-01-25',
    },
  ];

  return (
    <StyledContainer>
      <PageHeader title="Financial Dashboard" />

      <StyledDashboardGrid>
        <StyledFullWidthSection>
          <CashFlowSummaryCard
            totalRevenue={mockCashFlowData.totalRevenue}
            totalExpenses={mockCashFlowData.totalExpenses}
          />
        </StyledFullWidthSection>

        <ExpensesByCategoryCard expenses={mockExpensesByCategory} />

        <OutstandingInvoicesCard invoices={mockOutstandingInvoices} />
      </StyledDashboardGrid>
    </StyledContainer>
  );
};
