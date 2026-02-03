import { useCallback, useState } from 'react';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export type StripeInvoiceResult = {
  stripeInvoiceId: string;
  hostedInvoiceUrl: string | null;
};

export const useCreateStripeInvoice = () => {
  const [loading, setLoading] = useState(false);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const createStripeInvoice = useCallback(
    async (invoiceId: string): Promise<StripeInvoiceResult | null> => {
      setLoading(true);

      try {
        // Call backend endpoint to create Stripe invoice
        const response = await fetch('/api/stripe/create-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ invoiceId }),
        });

        if (!response.ok) {
          throw new Error('Failed to create Stripe invoice');
        }

        const result = await response.json();

        enqueueSuccessSnackBar({
          message: 'Stripe invoice created successfully',
        });

        return result;
      } catch (error) {
        console.error('Error creating Stripe invoice:', error);
        enqueueErrorSnackBar({
          message: 'Failed to create Stripe invoice. Check Stripe configuration.',
        });

        return null;
      } finally {
        setLoading(false);
      }
    },
    [enqueueSuccessSnackBar, enqueueErrorSnackBar],
  );

  return {
    createStripeInvoice,
    loading,
  };
};
