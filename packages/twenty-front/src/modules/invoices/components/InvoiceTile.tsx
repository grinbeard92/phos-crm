import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import {
  IconCalendar,
  IconCurrencyDollar,
  IconFileText,
} from 'twenty-ui/display';

import { type Invoice } from '../types/invoice.types';
import { microsToAmount } from '@/quotes/hooks/useQuoteCalculations';

type InvoiceTileProps = {
  invoice: Invoice;
};

const StyledTileContainer = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing(3)};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.background.tertiary};
    border-color: ${({ theme }) => theme.border.color.strong};
  }
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledInvoiceNumber = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const StyledStatus = styled.span<{ status: string }>`
  background: ${({ theme, status }) => {
    const colors: Record<string, string> = {
      DRAFT: theme.color.gray,
      SENT: theme.color.blue,
      VIEWED: theme.color.purple,
      PARTIAL: theme.color.yellow,
      PAID: theme.color.green,
      OVERDUE: theme.color.red,
      CANCELLED: theme.color.gray,
    };
    return colors[status] || theme.color.gray;
  }};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.font.color.inverted};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2)}`};
`;

const StyledDetails = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.font.color.secondary};
  display: flex;
  font-size: ${({ theme }) => theme.font.size.sm};
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledDetailItem = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const InvoiceTile = ({ invoice }: InvoiceTileProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/object/invoice/${invoice.id}`);
  };

  const balanceDue = invoice.balanceDue || invoice.total;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: balanceDue?.currencyCode || 'USD',
  }).format(microsToAmount(balanceDue?.amountMicros || 0));

  const formattedDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString()
    : '';

  return (
    <StyledTileContainer onClick={handleClick}>
      <StyledHeader>
        <StyledInvoiceNumber>{invoice.invoiceNumber}</StyledInvoiceNumber>
        <StyledStatus status={invoice.status || 'DRAFT'}>
          {invoice.status || 'DRAFT'}
        </StyledStatus>
      </StyledHeader>
      <StyledDetails>
        <StyledDetailItem>
          <IconFileText size={14} />
          <span>{invoice.name || 'Untitled Invoice'}</span>
        </StyledDetailItem>
        <StyledDetailItem>
          <IconCalendar size={14} />
          <span>{formattedDate}</span>
        </StyledDetailItem>
        <StyledDetailItem>
          <IconCurrencyDollar size={14} />
          <span>{formattedAmount} due</span>
        </StyledDetailItem>
      </StyledDetails>
    </StyledTileContainer>
  );
};
