import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useConvertQuoteToInvoice } from '@/quotes/hooks/useConvertQuoteToInvoice';
import { useNavigate } from 'react-router-dom';

export const ConvertQuoteToInvoiceActionEffect = () => {
  const quoteId = useSelectedRecordIdOrThrow();
  const { convertQuoteToInvoice } = useConvertQuoteToInvoice();
  const navigate = useNavigate();

  const onClick = async () => {
    const result = await convertQuoteToInvoice(quoteId, true); // Also create Stripe invoice

    if (result?.invoiceId) {
      // Navigate to the new invoice
      navigate(`/object/invoice/${result.invoiceId}`);
    }
  };

  return <Action onClick={onClick} />;
};
