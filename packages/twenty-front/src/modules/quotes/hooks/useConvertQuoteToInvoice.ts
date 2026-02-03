import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useState } from 'react';

export const useConvertQuoteToInvoice = () => {
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const [isConverting, setIsConverting] = useState(false);

  const convertQuoteToInvoice = async (
    quoteId: string,
    createStripeInvoice = false,
  ): Promise<{ invoiceId: string; stripeInvoiceId?: string; hostedInvoiceUrl?: string } | null> => {
    setIsConverting(true);

    try {
      const response = await fetch('/api/stripe/convert-quote-to-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quoteId, createStripeInvoice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert quote to invoice');
      }

      const result = await response.json();

      enqueueSuccessSnackBar({
        message: 'Quote converted to invoice successfully',
      });

      return result;
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to convert quote to invoice',
      });
      return null;
    } finally {
      setIsConverting(false);
    }
  };

  return { convertQuoteToInvoice, isConverting };
};
