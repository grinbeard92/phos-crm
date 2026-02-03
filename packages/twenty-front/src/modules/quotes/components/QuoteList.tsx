import styled from '@emotion/styled';
import { type ReactElement } from 'react';

import { type Quote } from '../types/quote.types';
import { QuoteTile } from './QuoteTile';

type QuoteListProps = {
  title: string;
  quotes: Quote[];
  button?: ReactElement | false | null;
  totalCount: number;
};

const StyledContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 24px;
`;

const StyledTitleBar = styled.h3`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  margin-top: ${({ theme }) => theme.spacing(4)};
  place-items: center;
  width: 100%;
`;

const StyledTitle = styled.span`
  color: ${({ theme }) => theme.font.color.primary};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const StyledCount = styled.span`
  color: ${({ theme }) => theme.font.color.light};
  margin-left: ${({ theme }) => theme.spacing(2)};
`;

const StyledQuoteContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
`;

export const QuoteList = ({
  title,
  quotes,
  totalCount,
  button,
}: QuoteListProps) => (
  <>
    {quotes && quotes.length > 0 && (
      <StyledContainer>
        <StyledTitleBar>
          <span>
            <StyledTitle>{title}</StyledTitle>
            <StyledCount>({totalCount})</StyledCount>
          </span>
          {button}
        </StyledTitleBar>
        <StyledQuoteContainer>
          {quotes.map((quote) => (
            <QuoteTile key={quote.id} quote={quote} />
          ))}
        </StyledQuoteContainer>
      </StyledContainer>
    )}
  </>
);
