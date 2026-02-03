import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from 'twenty-ui/input';
import { microsToDollars, dollarsToMicros } from '../utils/calculateInvoiceTotals';

type PaymentFormData = {
  paymentDate: string;
  amount: number; // in dollars for form input
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
};

type PaymentFormProps = {
  maxAmount: number; // Maximum amount that can be paid (balance due) in micros
  currencyCode?: string;
  onSubmit: (payment: PaymentFormData) => void;
  onCancel: () => void;
};

const StyledFormContainer = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledFormField = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-column: ${({ fullWidth }) => (fullWidth ? '1 / -1' : 'auto')};
`;

const StyledLabel = styled.label`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid
    ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.color.blue};
  }
`;

const StyledSelect = styled.select<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid
    ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.color.blue};
  }
`;

const StyledTextArea = styled.textarea<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid
    ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  font-family: inherit;
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.color.blue};
  }
`;

const StyledErrorText = styled.div`
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledHelpText = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-end;
`;

const PAYMENT_METHODS = [
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'ACH_TRANSFER', label: 'ACH Transfer' },
  { value: 'WIRE_TRANSFER', label: 'Wire Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CASH', label: 'Cash' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'OTHER', label: 'Other' },
];

export const PaymentForm = ({
  maxAmount,
  currencyCode = 'USD',
  onSubmit,
  onCancel,
}: PaymentFormProps) => {
  const maxAmountDollars = microsToDollars(maxAmount);
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: maxAmountDollars,
    paymentMethod: 'CREDIT_CARD',
    referenceNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (dollarsToMicros(formData.amount) > maxAmount) {
      newErrors.amount = `Amount cannot exceed ${maxAmountDollars.toFixed(2)} ${currencyCode}`;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <StyledFormContainer>
      <StyledFormGrid>
        <StyledFormField>
          <StyledLabel>Payment Date *</StyledLabel>
          <StyledInput
            type="date"
            value={formData.paymentDate}
            onChange={(e) =>
              setFormData({ ...formData, paymentDate: e.target.value })
            }
            hasError={!!errors.paymentDate}
          />
          {errors.paymentDate && (
            <StyledErrorText>{errors.paymentDate}</StyledErrorText>
          )}
        </StyledFormField>

        <StyledFormField>
          <StyledLabel>Amount ({currencyCode}) *</StyledLabel>
          <StyledInput
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
            }
            hasError={!!errors.amount}
          />
          {errors.amount && <StyledErrorText>{errors.amount}</StyledErrorText>}
          {!errors.amount && (
            <StyledHelpText>
              Max: {maxAmountDollars.toFixed(2)} {currencyCode}
            </StyledHelpText>
          )}
        </StyledFormField>

        <StyledFormField>
          <StyledLabel>Payment Method *</StyledLabel>
          <StyledSelect
            value={formData.paymentMethod}
            onChange={(e) =>
              setFormData({ ...formData, paymentMethod: e.target.value })
            }
            hasError={!!errors.paymentMethod}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </StyledSelect>
          {errors.paymentMethod && (
            <StyledErrorText>{errors.paymentMethod}</StyledErrorText>
          )}
        </StyledFormField>

        <StyledFormField>
          <StyledLabel>Reference Number</StyledLabel>
          <StyledInput
            type="text"
            value={formData.referenceNumber}
            onChange={(e) =>
              setFormData({ ...formData, referenceNumber: e.target.value })
            }
            placeholder="Check #, Transaction ID, etc."
          />
        </StyledFormField>

        <StyledFormField fullWidth>
          <StyledLabel>Notes</StyledLabel>
          <StyledTextArea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes about this payment..."
          />
        </StyledFormField>
      </StyledFormGrid>

      <StyledButtonGroup>
        <Button title="Cancel" onClick={onCancel} variant="secondary" />
        <Button title="Add Payment" onClick={handleSubmit} variant="primary" />
      </StyledButtonGroup>
    </StyledFormContainer>
  );
};
