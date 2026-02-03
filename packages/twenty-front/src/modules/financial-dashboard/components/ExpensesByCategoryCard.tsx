import styled from '@emotion/styled';
import { H2Title } from 'twenty-ui/display';

type CategoryExpense = {
  categoryName: string;
  total: number;
  color?: string;
};

type ExpensesByCategoryCardProps = {
  expenses: CategoryExpense[];
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

const StyledCategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledCategoryRow = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.background.transparent.lighter};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const StyledCategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledColorDot = styled.div<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  height: 12px;
  width: 12px;
`;

const StyledCategoryName = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledAmount = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledEmptyState = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  padding: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

const formatCurrency = (
  amount: number,
  currencyCode: string = 'USD',
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

export const ExpensesByCategoryCard = ({
  expenses,
  currencyCode = 'USD',
}: ExpensesByCategoryCardProps) => {
  // Sort by total descending
  const sortedExpenses = [...expenses].sort((a, b) => b.total - a.total);

  return (
    <StyledCard>
      <H2Title title="Expenses by Category" />

      {sortedExpenses.length === 0 ? (
        <StyledEmptyState>No expenses to display</StyledEmptyState>
      ) : (
        <StyledCategoryList>
          {sortedExpenses.map((expense, index) => (
            <StyledCategoryRow key={expense.categoryName}>
              <StyledCategoryInfo>
                <StyledColorDot
                  color={
                    expense.color ||
                    DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                  }
                />
                <StyledCategoryName>{expense.categoryName}</StyledCategoryName>
              </StyledCategoryInfo>
              <StyledAmount>
                {formatCurrency(expense.total, currencyCode)}
              </StyledAmount>
            </StyledCategoryRow>
          ))}
        </StyledCategoryList>
      )}
    </StyledCard>
  );
};
