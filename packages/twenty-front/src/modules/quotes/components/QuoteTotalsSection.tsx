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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
`;

const StyledRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 400px;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledLabel = styled.div`
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledValue = styled.div`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.primary};
  text-align: right;
  min-width: 120px;
`;

const StyledTotalRow = styled(StyledRow)`
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 2px solid ${({ theme }) => theme.border.color.strong};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const StyledTotalLabel = styled(StyledLabel)`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
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
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
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
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.tertiary};
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
          -{formatCurrencyFromMicros(
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
          +{formatCurrencyFromMicros(
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
