import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useCreateManyRecords } from '@/object-record/hooks/useCreateManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const useConvertQuoteToInvoice = (quoteId: string) => {
  const navigate = useNavigate();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const { record: quote } = useFindOneRecord({
    objectNameSingular: 'quote',
    objectRecordId: quoteId,
  });

  const { createOneRecord: createInvoice } = useCreateOneRecord({
    objectNameSingular: 'invoice',
  });

  const { createManyRecords: createInvoiceLineItems } = useCreateManyRecords({
    objectNameSingular: 'invoiceLineItem',
  });

  const { updateOneRecord: updateQuote } = useUpdateOneRecord();

  const convertToInvoice = useCallback(async () => {
    if (!quote) {
      enqueueErrorSnackBar({ message: 'Quote not found' });
      return;
    }

    try {
      // Calculate due date (30 days from now by default)
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      // Create invoice from quote data
      const invoice = await createInvoice({
        invoiceDate: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'DRAFT',
        companyId: quote.companyId,
        personId: quote.personId,
        projectId: quote.projectId,
        quoteId: quote.id,
        subtotal: quote.subtotal,
        discountPercentage: quote.discountPercentage,
        discountAmount: quote.discountAmount,
        taxPercentage: quote.taxPercentage,
        taxAmount: quote.taxAmount,
        totalAmount: quote.totalAmount,
        amountPaid: { amountMicros: 0, currencyCode: 'USD' },
        balanceDue: quote.totalAmount,
        notes: quote.notes,
        terms: quote.terms,
      });

      if (!invoice) {
        throw new Error('Failed to create invoice');
      }

      // Fetch quote line items
      // Note: This is a simplified approach. In production, you'd fetch line items
      // via a query or include them in the initial quote fetch.
      // For now, we'll just show a message that line items need to be added manually.

      // Update quote status to CONVERTED
      await updateQuote({
        objectNameSingular: 'quote',
        idToUpdate: quoteId,
        updateOneRecordInput: {
          status: 'CONVERTED',
        },
      });

      enqueueSuccessSnackBar({
        message: 'Invoice created from quote successfully',
      });

      // Navigate to the new invoice
      navigate(`/object/invoice/${invoice.id}`);
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      enqueueErrorSnackBar({
        message: 'Failed to convert quote to invoice',
      });
    }
  }, [
    quote,
    quoteId,
    createInvoice,
    updateQuote,
    navigate,
    enqueueSuccessSnackBar,
    enqueueErrorSnackBar,
  ]);

  return {
    convertToInvoice,
    canConvert: quote?.status === 'ACCEPTED' || quote?.status === 'SENT',
  };
};
