import styled from '@emotion/styled';
import { IconPlus, IconTrash } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { formatCurrencyFromMicros } from '../utils/calculateInvoiceTotals';

type Payment = {
  id: string;
  paymentDate: string;
  amount: {
    amountMicros: number;
    currencyCode: string;
  };
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
};

type PaymentListProps = {
  payments: Payment[];
  onAdd: () => void;
  onRemove: (paymentId: string) => void;
  readonly?: boolean;
  currencyCode?: string;
};

const StyledContainer = styled.div`
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
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
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
    color: ${({ theme }) => theme.color.red};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledAmountCell = styled(StyledTableCell)`
  text-align: right;
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledAddButtonContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  background: ${({ theme }) => theme.background.secondary};
`;

const StyledEmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing(6)} ${({ theme }) => theme.spacing(3)};
  text-align: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.md};
`;

const formatPaymentMethod = (method: string): string => {
  if (!method) return 'Unknown';
  return method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export const PaymentList = ({
  payments,
  onAdd,
  onRemove,
  readonly = false,
  currencyCode = 'USD',
}: PaymentListProps) => {
  const hasPayments = payments.length > 0;

  return (
    <StyledContainer>
      {hasPayments ? (
        <StyledTable>
          <StyledTableHeader>
            <tr>
              <StyledTableHeaderCell style={{ width: '140px' }}>
                Date
              </StyledTableHeaderCell>
              <StyledTableHeaderCell style={{ width: '150px' }}>
                Method
              </StyledTableHeaderCell>
              <StyledTableHeaderCell>Reference</StyledTableHeaderCell>
              <StyledTableHeaderCell style={{ width: '180px', textAlign: 'right' }}>
                Amount
              </StyledTableHeaderCell>
              <StyledTableHeaderCell style={{ width: '50px' }}>
                {/* Actions */}
              </StyledTableHeaderCell>
            </tr>
          </StyledTableHeader>
          <tbody>
            {payments.map((payment) => (
              <StyledTableRow key={payment.id}>
                <StyledTableCell>
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </StyledTableCell>
                <StyledTableCell>
                  {formatPaymentMethod(payment.paymentMethod)}
                </StyledTableCell>
                <StyledTableCell>
                  {payment.referenceNumber || payment.notes || '—'}
                </StyledTableCell>
                <StyledAmountCell>
                  {formatCurrencyFromMicros(
                    payment.amount.amountMicros,
                    payment.amount.currencyCode || currencyCode,
                  )}
                </StyledAmountCell>
                <StyledTableCell>
                  {!readonly && (
                    <StyledIconButton
                      onClick={() => onRemove(payment.id)}
                      title="Remove payment"
                    >
                      <IconTrash size={16} />
                    </StyledIconButton>
                  )}
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </tbody>
        </StyledTable>
      ) : (
        <StyledEmptyState>No payments recorded yet</StyledEmptyState>
      )}
      {!readonly && (
        <StyledAddButtonContainer>
          <Button
            Icon={IconPlus}
            title="Add Payment"
            onClick={onAdd}
            variant="secondary"
            size="small"
          />
        </StyledAddButtonContainer>
      )}
    </StyledContainer>
  );
};
