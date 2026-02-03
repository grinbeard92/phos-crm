import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from 'twenty-ui/input';
import { H2Title } from 'twenty-ui/display';
import { useNavigate } from 'react-router-dom';
import { useCreateExpense } from '../hooks/useCreateExpense';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

type ExpenseFormData = {
  name: string;
  date: string;
  amount: number;
  vendor: string;
  paymentMethod: string;
  taxDeductible: boolean;
  billable: boolean;
  notes: string;
  expenseCategoryId?: string;
  projectId?: string;
};

type ExpenseFormProps = {
  onSubmit?: (expenseId: string) => void;
  onCancel?: () => void;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(6)};
  max-width: 800px;
  margin: 0 auto;
`;

const StyledFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
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

const StyledTextArea = styled.textarea`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  font-family: inherit;
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
  }
`;

const StyledCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const StyledErrorText = styled.div`
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const PAYMENT_METHODS = [
  { value: '', label: 'Select payment method' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Check' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'VENMO', label: 'Venmo' },
  { value: 'OTHER', label: 'Other' },
];

export const ExpenseForm = ({ onSubmit, onCancel }: ExpenseFormProps) => {
  const navigate = useNavigate();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const { createExpense, loading } = useCreateExpense();

  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    vendor: '',
    paymentMethod: '',
    taxDeductible: true,
    billable: false,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      const expense = await createExpense({
        name: formData.name,
        date: formData.date,
        amount: {
          amountMicros: Math.round(formData.amount * 1000000),
          currencyCode: 'USD',
        },
        vendor: formData.vendor || null,
        paymentMethod: formData.paymentMethod,
        taxDeductible: formData.taxDeductible,
        billable: formData.billable,
        status: 'DRAFT',
        notes: formData.notes || null,
        expenseCategoryId: formData.expenseCategoryId || null,
        projectId: formData.projectId || null,
      });

      if (expense) {
        enqueueSuccessSnackBar({ message: 'Expense created successfully' });
        if (onSubmit) {
          onSubmit(expense.id);
        } else {
          navigate(`/object/expense/${expense.id}`);
        }
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      enqueueErrorSnackBar({ message: 'Failed to create expense' });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/objects/expenses');
    }
  };

  return (
    <StyledContainer>
      <H2Title title="New Expense" />

      <StyledFormGrid>
        <StyledFormField fullWidth>
          <StyledLabel>Description *</StyledLabel>
          <StyledInput
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="What was this expense for?"
            hasError={!!errors.name}
          />
          {errors.name && <StyledErrorText>{errors.name}</StyledErrorText>}
        </StyledFormField>

        <StyledFormField>
          <StyledLabel>Date *</StyledLabel>
          <StyledInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            hasError={!!errors.date}
          />
          {errors.date && <StyledErrorText>{errors.date}</StyledErrorText>}
        </StyledFormField>

        <StyledFormField>
          <StyledLabel>Amount (USD) *</StyledLabel>
          <StyledInput
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
            hasError={!!errors.amount}
          />
          {errors.amount && <StyledErrorText>{errors.amount}</StyledErrorText>}
        </StyledFormField>

        <StyledFormField>
          <StyledLabel>Vendor</StyledLabel>
          <StyledInput
            type="text"
            value={formData.vendor}
            onChange={(e) =>
              setFormData({ ...formData, vendor: e.target.value })
            }
            placeholder="Business or vendor name"
          />
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
          <StyledCheckboxContainer>
            <StyledCheckbox
              type="checkbox"
              checked={formData.taxDeductible}
              onChange={(e) =>
                setFormData({ ...formData, taxDeductible: e.target.checked })
              }
            />
            <StyledLabel>Tax Deductible</StyledLabel>
          </StyledCheckboxContainer>
        </StyledFormField>

        <StyledFormField>
          <StyledCheckboxContainer>
            <StyledCheckbox
              type="checkbox"
              checked={formData.billable}
              onChange={(e) =>
                setFormData({ ...formData, billable: e.target.checked })
              }
            />
            <StyledLabel>Billable to Client</StyledLabel>
          </StyledCheckboxContainer>
        </StyledFormField>

        <StyledFormField fullWidth>
          <StyledLabel>Notes</StyledLabel>
          <StyledTextArea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes or details..."
          />
        </StyledFormField>
      </StyledFormGrid>

      <StyledButtonGroup>
        <Button
          title="Cancel"
          onClick={handleCancel}
          variant="secondary"
          disabled={loading}
        />
        <Button
          title="Create Expense"
          onClick={handleSubmit}
          variant="primary"
          disabled={loading}
        />
      </StyledButtonGroup>
    </StyledContainer>
  );
};
