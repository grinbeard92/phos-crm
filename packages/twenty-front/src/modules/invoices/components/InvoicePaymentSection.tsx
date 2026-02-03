import { useState } from 'react';
import styled from '@emotion/styled';
import { H2Title } from 'twenty-ui/display';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { PaymentList } from './PaymentList';
import { PaymentForm } from './PaymentForm';
import { dollarsToMicros } from '../utils/calculateInvoiceTotals';

type Payment = {
  id: string;
  paymentDate: string;
  amount: {
    amountMicros: number;
    currencyCode: string;
  };
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
};

type Invoice = {
  id: string;
  status?: string;
  amountPaid?: {
    amountMicros: number;
    currencyCode: string;
  };
  balanceDue?: {
    amountMicros: number;
    currencyCode: string;
  };
  totalAmount?: {
    amountMicros: number;
    currencyCode: string;
  };
  payments?: Payment[];
};

type InvoicePaymentSectionProps = {
  invoice: Invoice;
  readonly?: boolean;
};

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledFormWrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

export const InvoicePaymentSection = ({
  invoice,
  readonly = false,
}: InvoicePaymentSectionProps) => {
  const [showForm, setShowForm] = useState(false);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const { createOneRecord: createPayment } = useCreateOneRecord({
    objectNameSingular: 'payment',
  });

  const { deleteOneRecord: deletePayment } = useDeleteOneRecord({
    objectNameSingular: 'payment',
  });

  const { updateOneRecord: updateInvoice } = useUpdateOneRecord();

  const currencyCode = invoice.totalAmount?.currencyCode || 'USD';
  const payments = invoice.payments || [];
  const balanceDueMicros = invoice.balanceDue?.amountMicros || 0;

  const calculateNewAmounts = (
    payments: Payment[],
    totalAmountMicros: number,
  ) => {
    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount.amountMicros,
      0,
    );
    const newBalanceDue = Math.max(0, totalAmountMicros - totalPaid);

    return {
      amountPaid: { amountMicros: totalPaid, currencyCode },
      balanceDue: { amountMicros: newBalanceDue, currencyCode },
      status:
        newBalanceDue === 0
          ? 'PAID'
          : totalPaid > 0
            ? 'PARTIALLY_PAID'
            : invoice.status,
    };
  };

  const handleAddPayment = async (formData: {
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string;
    notes: string;
  }) => {
    try {
      const newPayment = await createPayment({
        paymentDate: formData.paymentDate,
        amount: {
          amountMicros: dollarsToMicros(formData.amount),
          currencyCode,
        },
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || null,
        notes: formData.notes || null,
        invoiceId: invoice.id,
      });

      if (!newPayment) {
        throw new Error('Failed to create payment');
      }

      // Update invoice amounts and status
      const updatedPayments = [...payments, newPayment as unknown as Payment];
      const updates = calculateNewAmounts(
        updatedPayments,
        invoice.totalAmount?.amountMicros || 0,
      );

      await updateInvoice({
        objectNameSingular: 'invoice',
        idToUpdate: invoice.id,
        updateOneRecordInput: updates,
      });

      enqueueSuccessSnackBar({ message: 'Payment added successfully' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      enqueueErrorSnackBar({ message: 'Failed to add payment' });
    }
  };

  const handleRemovePayment = async (paymentId: string) => {
    try {
      await deletePayment(paymentId);

      // Update invoice amounts and status
      const updatedPayments = payments.filter((p) => p.id !== paymentId);
      const updates = calculateNewAmounts(
        updatedPayments,
        invoice.totalAmount?.amountMicros || 0,
      );

      await updateInvoice({
        objectNameSingular: 'invoice',
        idToUpdate: invoice.id,
        updateOneRecordInput: updates,
      });

      enqueueSuccessSnackBar({ message: 'Payment removed successfully' });
    } catch (error) {
      console.error('Error removing payment:', error);
      enqueueErrorSnackBar({ message: 'Failed to remove payment' });
    }
  };

  return (
    <StyledSection>
      <StyledHeader>
        <H2Title title="Payments" />
      </StyledHeader>

      <PaymentList
        payments={payments}
        onAdd={() => setShowForm(true)}
        onRemove={handleRemovePayment}
        readonly={readonly}
        currencyCode={currencyCode}
      />

      {showForm && !readonly && (
        <StyledFormWrapper>
          <PaymentForm
            maxAmount={balanceDueMicros}
            currencyCode={currencyCode}
            onSubmit={handleAddPayment}
            onCancel={() => setShowForm(false)}
          />
        </StyledFormWrapper>
      )}
    </StyledSection>
  );
};
