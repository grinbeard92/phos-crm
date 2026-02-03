import { useCallback, useEffect } from 'react';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useCreateStripeInvoice } from '@/invoices/hooks/useCreateStripeInvoice';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

export const CreateStripeInvoiceActionEffect = () => {
  const invoiceId = useSelectedRecordIdOrThrow();
  const { createStripeInvoice, loading } = useCreateStripeInvoice();
  const { updateOneRecord } = useUpdateOneRecord();

  const handleCreateStripeInvoice = useCallback(async () => {
    const result = await createStripeInvoice(invoiceId);

    if (result) {
      // Update CRM invoice with Stripe details
      await updateOneRecord({
        objectNameSingular: 'invoice',
        idToUpdate: invoiceId,
        updateOneRecordInput: {
          stripeInvoiceId: result.stripeInvoiceId,
          stripePaymentLink: result.hostedInvoiceUrl,
        },
      });
    }
  }, [createStripeInvoice, invoiceId, updateOneRecord]);

  // Execute on mount
  useEffect(() => {
    if (!loading) {
      handleCreateStripeInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
