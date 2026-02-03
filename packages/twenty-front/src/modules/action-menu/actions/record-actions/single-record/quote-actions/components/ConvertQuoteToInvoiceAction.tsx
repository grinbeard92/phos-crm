import { useCallback, useEffect } from 'react';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useConvertQuoteToInvoice } from '@/quotes/hooks/useConvertQuoteToInvoice';

export const ConvertQuoteToInvoiceActionEffect = () => {
  const quoteId = useSelectedRecordIdOrThrow();
  const { convertToInvoice } = useConvertQuoteToInvoice(quoteId);

  const handleConvert = useCallback(() => {
    convertToInvoice();
  }, [convertToInvoice]);

  // Execute on mount
  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  return null;
};
