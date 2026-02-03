import styled from '@emotion/styled';
import { type QuoteCalculations } from '../types/quote-form.types';
import { formatCurrencyFromMicros } from '../utils/calculateQuoteTotals';

type QuoteTotalsSectionProps = {
  calculations: QuoteCalculations;
  discountPercentage: number;
  taxPercentage: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  readonly?: boolean;
};

const StyledContainer = styled.div`
  align-items: flex-end;
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(4)};
  justify-content: space-between;
  min-width: 400px;
`;

const StyledLabel = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
`;

const StyledValue = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  min-width: 120px;
  text-align: right;
`;

const StyledTotalRow = styled(StyledRow)`
  border-top: 2px solid ${({ theme }) => theme.border.color.strong};
  margin-top: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledTotalLabel = styled(StyledLabel)`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const StyledTotalValue = styled(StyledValue)`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const StyledInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledPercentInput = styled.input`
  width: 80px;
  padding: ${({ theme }) => theme.spacing(1.5)}
    ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  text-align: right;
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
  }

  &:disabled {
    background: ${({ theme }) => theme.background.tertiary};
    cursor: not-allowed;
  }
`;

const StyledPercentSymbol = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.md};
`;

export const QuoteTotalsSection = ({
  calculations,
  discountPercentage,
  taxPercentage,
  onDiscountChange,
  onTaxChange,
  readonly = false,
}: QuoteTotalsSectionProps) => {
  const handleDiscountChange = (value: string) => {
    const percent = parseFloat(value) || 0;
    onDiscountChange(Math.max(0, Math.min(100, percent)));
  };

  const handleTaxChange = (value: string) => {
    const percent = parseFloat(value) || 0;
    onTaxChange(Math.max(0, Math.min(100, percent)));
  };

  return (
    <StyledContainer>
      <StyledRow>
        <StyledLabel>Subtotal:</StyledLabel>
        <StyledValue>
          {formatCurrencyFromMicros(
            calculations.subtotalMicros,
            calculations.currencyCode,
          )}
        </StyledValue>
      </StyledRow>

      <StyledRow>
        <StyledInputGroup>
          <StyledLabel>Discount:</StyledLabel>
          <StyledPercentInput
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={discountPercentage.toFixed(2)}
            onChange={(e) => handleDiscountChange(e.target.value)}
            disabled={readonly}
          />
          <StyledPercentSymbol>%</StyledPercentSymbol>
        </StyledInputGroup>
        <StyledValue>
          -
          {formatCurrencyFromMicros(
            calculations.discountAmountMicros,
            calculations.currencyCode,
          )}
        </StyledValue>
      </StyledRow>

      <StyledRow>
        <StyledInputGroup>
          <StyledLabel>Tax:</StyledLabel>
          <StyledPercentInput
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={taxPercentage.toFixed(2)}
            onChange={(e) => handleTaxChange(e.target.value)}
            disabled={readonly}
          />
          <StyledPercentSymbol>%</StyledPercentSymbol>
        </StyledInputGroup>
        <StyledValue>
          +
          {formatCurrencyFromMicros(
            calculations.taxAmountMicros,
            calculations.currencyCode,
          )}
        </StyledValue>
      </StyledRow>

      <StyledTotalRow>
        <StyledTotalLabel>Total:</StyledTotalLabel>
        <StyledTotalValue>
          {formatCurrencyFromMicros(
            calculations.totalMicros,
            calculations.currencyCode,
          )}
        </StyledTotalValue>
      </StyledTotalRow>
    </StyledContainer>
  );
};
