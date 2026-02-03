import { ExpenseForm } from '@/expenses/components/ExpenseForm';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import styled from '@emotion/styled';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
`;

export const CreateExpensePage = () => {
  return (
    <StyledContainer>
      <PageHeader title="New Expense" />
      <ExpenseForm />
    </StyledContainer>
  );
};
