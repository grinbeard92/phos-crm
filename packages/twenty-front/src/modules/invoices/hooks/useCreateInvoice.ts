import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_INVOICE,
  CREATE_INVOICE_LINE_ITEM,
} from '../graphql/mutations/createInvoice';
import { type InvoiceFormData } from '../types/invoice-form.types';
import { calculateInvoiceTotals } from '../utils/calculateInvoiceTotals';

export const useCreateInvoice = () => {
  const navigate = useNavigate();
  const [createInvoiceMutation] = useMutation(CREATE_INVOICE);
  const [createLineItemMutation] = useMutation(CREATE_INVOICE_LINE_ITEM);

  const createInvoice = async (formData: InvoiceFormData) => {
    try {
      // Calculate final totals
      const calculations = calculateInvoiceTotals(
        formData.lineItems,
        formData.discountPercentage,
        formData.taxPercentage,
        formData.amountPaidMicros,
      );

      // Create the invoice first
      const { data: invoiceData } = await createInvoiceMutation({
        variables: {
          input: {
            companyId: formData.companyId,
            contactId: formData.contactId,
            projectId: formData.projectId,
            quoteId: formData.quoteId,
            invoiceNumber: formData.invoiceNumber || undefined, // Let backend generate if empty
            invoiceDate: formData.invoiceDate,
            dueDate: formData.dueDate,
            status: formData.status,
            discountPercentage: formData.discountPercentage,
            taxPercentage: formData.taxPercentage,
            subtotal: {
              amountMicros: calculations.subtotalMicros,
              currencyCode: calculations.currencyCode,
            },
            discountAmount: {
              amountMicros: calculations.discountAmountMicros,
              currencyCode: calculations.currencyCode,
            },
            taxAmount: {
              amountMicros: calculations.taxAmountMicros,
              currencyCode: calculations.currencyCode,
            },
            total: {
              amountMicros: calculations.totalMicros,
              currencyCode: calculations.currencyCode,
            },
            amountPaid: {
              amountMicros: formData.amountPaidMicros,
              currencyCode: calculations.currencyCode,
            },
            balanceDue: {
              amountMicros: calculations.balanceDueMicros,
              currencyCode: calculations.currencyCode,
            },
            notes: formData.notes,
            paymentTerms: formData.paymentTerms,
            stripeInvoiceId: formData.stripeInvoiceId,
            stripePaymentLink: formData.stripePaymentLink,
          },
        },
      });

      const invoiceId = invoiceData?.createInvoice?.id;

      if (!invoiceId) {
        throw new Error('Failed to create invoice - no ID returned');
      }

      // Create all line items
      await Promise.all(
        formData.lineItems.map((item) =>
          createLineItemMutation({
            variables: {
              input: {
                invoiceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: {
                  amountMicros: item.unitPriceMicros,
                  currencyCode: item.currencyCode,
                },
                serviceCategory: item.serviceCategory,
                sortOrder: item.sortOrder,
              },
            },
          }),
        ),
      );

      // Navigate to the new invoice
      navigate(`/object/invoice/${invoiceId}`);

      return invoiceId;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  };

  return { createInvoice };
};
