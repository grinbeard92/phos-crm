import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useCreateStripeInvoice } from '@/invoices/hooks/useCreateStripeInvoice';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

export const CreateStripeInvoiceActionEffect = () => {
  const invoiceId = useSelectedRecordIdOrThrow();
  const { createStripeInvoice } = useCreateStripeInvoice();
  const { updateOneRecord } = useUpdateOneRecord();

  const onClick = async () => {
    const result = await createStripeInvoice(invoiceId);

    if (result) {
      await updateOneRecord({
        objectNameSingular: 'invoice',
        idToUpdate: invoiceId,
        updateOneRecordInput: {
          stripeInvoiceId: result.stripeInvoiceId,
          stripePaymentLink: result.hostedInvoiceUrl,
        },
      });
    }
  };

  return <Action onClick={onClick} />;
};
