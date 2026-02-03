import styled from '@emotion/styled';
import { H2Title } from 'twenty-ui/display';

type CashFlowSummaryCardProps = {
  totalRevenue: number;
  totalExpenses: number;
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

const StyledMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledMetricLabel = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledMetricValue = styled.div<{
  isNegative?: boolean;
  isPositive?: boolean;
}>`
  color: ${({ theme, isNegative, isPositive }) =>
    isNegative
      ? theme.color.red
      : isPositive
        ? theme.color.green
        : theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const formatCurrency = (
  amount: number,
  currencyCode: string = 'USD',
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

export const CashFlowSummaryCard = ({
  totalRevenue,
  totalExpenses,
  currencyCode = 'USD',
}: CashFlowSummaryCardProps) => {
  const netCashFlow = totalRevenue - totalExpenses;

  return (
    <StyledCard>
      <H2Title title="Cash Flow Summary" />

      <StyledMetricsGrid>
        <StyledMetric>
          <StyledMetricLabel>Total Revenue</StyledMetricLabel>
          <StyledMetricValue isPositive={totalRevenue > 0}>
            {formatCurrency(totalRevenue, currencyCode)}
          </StyledMetricValue>
        </StyledMetric>

        <StyledMetric>
          <StyledMetricLabel>Total Expenses</StyledMetricLabel>
          <StyledMetricValue isNegative={totalExpenses > 0}>
            {formatCurrency(totalExpenses, currencyCode)}
          </StyledMetricValue>
        </StyledMetric>

        <StyledMetric>
          <StyledMetricLabel>Net Cash Flow</StyledMetricLabel>
          <StyledMetricValue
            isPositive={netCashFlow > 0}
            isNegative={netCashFlow < 0}
          >
            {formatCurrency(netCashFlow, currencyCode)}
          </StyledMetricValue>
        </StyledMetric>
      </StyledMetricsGrid>
    </StyledCard>
  );
};
