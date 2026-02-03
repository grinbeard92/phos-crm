import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_QUOTE, CREATE_QUOTE_LINE_ITEM } from '../graphql/mutations/createQuote';
import { type QuoteFormData } from '../types/quote-form.types';
import { calculateQuoteTotals } from '../utils/calculateQuoteTotals';

export const useCreateQuote = () => {
  const navigate = useNavigate();
  const [createQuoteMutation] = useMutation(CREATE_QUOTE);
  const [createLineItemMutation] = useMutation(CREATE_QUOTE_LINE_ITEM);

  const createQuote = async (formData: QuoteFormData) => {
    try {
      // Calculate final totals
      const calculations = calculateQuoteTotals(
        formData.lineItems,
        formData.discountPercentage,
        formData.taxPercentage,
      );

      // Create the quote first
      const { data: quoteData } = await createQuoteMutation({
        variables: {
          input: {
            companyId: formData.companyId,
            contactId: formData.contactId,
            projectId: formData.projectId,
            quoteNumber: formData.quoteNumber || undefined, // Let backend generate if empty
            quoteDate: formData.quoteDate,
            expirationDate: formData.expirationDate,
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
            notes: formData.notes,
            terms: formData.terms,
          },
        },
      });

      const quoteId = quoteData?.createQuote?.id;

      if (!quoteId) {
        throw new Error('Failed to create quote - no ID returned');
      }

      // Create all line items
      await Promise.all(
        formData.lineItems.map((item) =>
          createLineItemMutation({
            variables: {
              input: {
                quoteId,
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

      // Navigate to the new quote
      navigate(`/object/quote/${quoteId}`);

      return quoteId;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  };

  return { createQuote };
};
