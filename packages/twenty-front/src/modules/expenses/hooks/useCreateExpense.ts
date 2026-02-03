import { useCallback, useState } from 'react';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type CreateExpenseInput = {
  name: string;
  date: string;
  amount: {
    amountMicros: number;
    currencyCode: string;
  };
  vendor: string | null;
  paymentMethod: string;
  taxDeductible: boolean;
  billable: boolean;
  status: string;
  notes: string | null;
  expenseCategoryId?: string | null;
  projectId?: string | null;
};

export const useCreateExpense = () => {
  const [loading, setLoading] = useState(false);

  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'expense',
  });

  const createExpense = useCallback(
    async (input: CreateExpenseInput): Promise<ObjectRecord | null> => {
      setLoading(true);

      try {
        const expense = await createOneRecord(input);

        return expense;
      } catch (error) {
        console.error('Error creating expense:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [createOneRecord],
  );

  return {
    createExpense,
    loading,
  };
};
