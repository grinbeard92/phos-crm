import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useConvertQuoteToInvoice } from '@/quotes/hooks/useConvertQuoteToInvoice';

export const ConvertQuoteToInvoiceActionEffect = () => {
  const quoteId = useSelectedRecordIdOrThrow();
  const { convertToInvoice } = useConvertQuoteToInvoice(quoteId);

  const onClick = () => {
    convertToInvoice();
  };

  return <Action onClick={onClick} />;
};
