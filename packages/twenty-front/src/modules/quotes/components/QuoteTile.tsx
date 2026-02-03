import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { IconCalendar, IconCurrencyDollar, IconFileText } from 'twenty-ui/display';

import { type Quote } from '../types/quote.types';
import { microsToAmount } from '../hooks/useQuoteCalculations';

type QuoteTileProps = {
  quote: Quote;
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

const StyledQuoteNumber = styled.div`
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
      ACCEPTED: theme.color.green,
      DECLINED: theme.color.red,
      EXPIRED: theme.color.orange,
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

export const QuoteTile = ({ quote }: QuoteTileProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/object/quote/${quote.id}`);
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: quote.total?.currencyCode || 'USD',
  }).format(microsToAmount(quote.total?.amountMicros || 0));

  const formattedDate = quote.quoteDate
    ? new Date(quote.quoteDate).toLocaleDateString()
    : '';

  return (
    <StyledTileContainer onClick={handleClick}>
      <StyledHeader>
        <StyledQuoteNumber>{quote.quoteNumber}</StyledQuoteNumber>
        <StyledStatus status={quote.status || 'DRAFT'}>
          {quote.status || 'DRAFT'}
        </StyledStatus>
      </StyledHeader>
      <StyledDetails>
        <StyledDetailItem>
          <IconFileText size={14} />
          <span>{quote.name || 'Untitled Quote'}</span>
        </StyledDetailItem>
        <StyledDetailItem>
          <IconCalendar size={14} />
          <span>{formattedDate}</span>
        </StyledDetailItem>
        <StyledDetailItem>
          <IconCurrencyDollar size={14} />
          <span>{formattedAmount}</span>
        </StyledDetailItem>
      </StyledDetails>
    </StyledTileContainer>
  );
};
