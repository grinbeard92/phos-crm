import styled from '@emotion/styled';
import { IconPlus, IconTrash, IconGripVertical } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { type QuoteLineItemFormData } from '../types/quote-form.types';
import {
  formatCurrencyFromMicros,
  dollarsToMicros,
  microsToDollars,
} from '../utils/calculateQuoteTotals';

type QuoteLineItemEditorProps = {
  lineItems: QuoteLineItemFormData[];
  onUpdate: (index: number, updates: Partial<QuoteLineItemFormData>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  errors?: Record<string, string>;
  readonly?: boolean;
};

const StyledTableContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  overflow: hidden;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledTableHeader = styled.thead`
  background: ${({ theme }) => theme.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.border.color.medium};
`;

const StyledTableHeaderCell = styled.th`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  text-align: left;
`;

const StyledTableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.background.transparent.lighter};
  }
`;

const StyledTableCell = styled.td`
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  vertical-align: middle;
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
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

  &:disabled {
    background: ${({ theme }) => theme.background.secondary};
    cursor: not-allowed;
  }
`;

const StyledNumberInput = styled(StyledInput)`
  text-align: right;
  width: 100px;
`;

const StyledTextArea = styled.textarea<{ hasError?: boolean }>`
  width: 100%;
  min-height: 40px;
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

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.color.blue};
  }

  &:disabled {
    background: ${({ theme }) => theme.background.secondary};
    cursor: not-allowed;
  }
`;

const StyledIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(1)};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.font.color.tertiary};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.border.radius.sm};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.background.transparent.light};
    color: ${({ theme }) => theme.font.color.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledAmountText = styled.div`
  text-align: right;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledAddButtonContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  background: ${({ theme }) => theme.background.secondary};
`;

const StyledErrorText = styled.div`
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.xs};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

export const QuoteLineItemEditor = ({
  lineItems,
  onUpdate,
  onAdd,
  onRemove,
  errors = {},
  readonly = false,
}: QuoteLineItemEditorProps) => {
  const handleDescriptionChange = (index: number, description: string) => {
    onUpdate(index, { description });
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseFloat(value) || 0;
    onUpdate(index, { quantity: Math.max(0, quantity) });
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    const dollars = parseFloat(value) || 0;
    const unitPriceMicros = dollarsToMicros(Math.max(0, dollars));
    onUpdate(index, { unitPriceMicros });
  };

  const canRemove = lineItems.length > 1;

  return (
    <StyledTableContainer>
      <StyledTable>
        <StyledTableHeader>
          <tr>
            <StyledTableHeaderCell style={{ width: '30px' }}>
              {/* Drag handle column */}
            </StyledTableHeaderCell>
            <StyledTableHeaderCell style={{ width: '40%' }}>
              Description
            </StyledTableHeaderCell>
            <StyledTableHeaderCell
              style={{ width: '120px', textAlign: 'right' }}
            >
              Quantity
            </StyledTableHeaderCell>
            <StyledTableHeaderCell
              style={{ width: '140px', textAlign: 'right' }}
            >
              Unit Price
            </StyledTableHeaderCell>
            <StyledTableHeaderCell
              style={{ width: '140px', textAlign: 'right' }}
            >
              Amount
            </StyledTableHeaderCell>
            <StyledTableHeaderCell style={{ width: '50px' }}>
              {/* Actions column */}
            </StyledTableHeaderCell>
          </tr>
        </StyledTableHeader>
        <tbody>
          {lineItems.map((item, index) => {
            const lineTotal = item.quantity * item.unitPriceMicros;
            const descError = errors[`lineItem.${index}.description`];
            const qtyError = errors[`lineItem.${index}.quantity`];
            const priceError = errors[`lineItem.${index}.unitPrice`];

            return (
              <StyledTableRow key={item.id}>
                <StyledTableCell>
                  <StyledIconButton disabled={readonly}>
                    <IconGripVertical size={16} />
                  </StyledIconButton>
                </StyledTableCell>
                <StyledTableCell>
                  <StyledTextArea
                    value={item.description}
                    onChange={(e) =>
                      handleDescriptionChange(index, e.target.value)
                    }
                    placeholder="Description of service or product"
                    disabled={readonly}
                    hasError={!!descError}
                  />
                  {descError && <StyledErrorText>{descError}</StyledErrorText>}
                </StyledTableCell>
                <StyledTableCell>
                  <StyledNumberInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                    disabled={readonly}
                    hasError={!!qtyError}
                  />
                  {qtyError && <StyledErrorText>{qtyError}</StyledErrorText>}
                </StyledTableCell>
                <StyledTableCell>
                  <StyledNumberInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={microsToDollars(item.unitPriceMicros).toFixed(2)}
                    onChange={(e) =>
                      handleUnitPriceChange(index, e.target.value)
                    }
                    disabled={readonly}
                    hasError={!!priceError}
                  />
                  {priceError && (
                    <StyledErrorText>{priceError}</StyledErrorText>
                  )}
                </StyledTableCell>
                <StyledTableCell>
                  <StyledAmountText>
                    {formatCurrencyFromMicros(lineTotal, item.currencyCode)}
                  </StyledAmountText>
                </StyledTableCell>
                <StyledTableCell>
                  <StyledIconButton
                    onClick={() => onRemove(index)}
                    disabled={readonly || !canRemove}
                    title={
                      canRemove
                        ? 'Remove line item'
                        : 'At least one line item required'
                    }
                  >
                    <IconTrash size={16} />
                  </StyledIconButton>
                </StyledTableCell>
              </StyledTableRow>
            );
          })}
        </tbody>
      </StyledTable>
      {!readonly && (
        <StyledAddButtonContainer>
          <Button
            Icon={IconPlus}
            title="Add Line Item"
            onClick={onAdd}
            variant="secondary"
            size="small"
          />
        </StyledAddButtonContainer>
      )}
    </StyledTableContainer>
  );
};
