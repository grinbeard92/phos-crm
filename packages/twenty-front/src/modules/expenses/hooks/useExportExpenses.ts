import { useCallback, useState } from 'react';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export type ExportFilters = {
  startDate?: string;
  endDate?: string;
  taxDeductibleOnly?: boolean;
  categoryId?: string;
};

export type ExportFormat = 'csv' | 'excel';

export const useExportExpenses = () => {
  const [loading, setLoading] = useState(false);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const generateCSV = useCallback((expenses: any[]): string => {
    const headers = [
      'Date',
      'Description',
      'Amount',
      'Currency',
      'Vendor',
      'Category',
      'Payment Method',
      'Tax Deductible',
      'Billable',
      'Status',
      'Notes',
    ];

    const rows = expenses.map((expense) => [
      expense.date || '',
      expense.name || '',
      expense.amount?.amountMicros
        ? (expense.amount.amountMicros / 1000000).toFixed(2)
        : '0.00',
      expense.amount?.currencyCode || 'USD',
      expense.vendor || '',
      expense.expenseCategory?.name || '',
      expense.paymentMethod || '',
      expense.taxDeductible ? 'Yes' : 'No',
      expense.billable ? 'Yes' : 'No',
      expense.status || '',
      expense.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(','),
      ),
    ].join('\n');

    return csvContent;
  }, []);

  const downloadFile = useCallback(
    (content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    [],
  );

  const exportExpenses = useCallback(
    async (
      expenses: any[],
      format: ExportFormat = 'csv',
      filters?: ExportFilters,
    ) => {
      setLoading(true);

      try {
        let filteredExpenses = [...expenses];

        // Apply filters
        if (filters?.startDate) {
          const startDate = filters.startDate;
          filteredExpenses = filteredExpenses.filter(
            (e) => e.date >= startDate,
          );
        }

        if (filters?.endDate) {
          const endDate = filters.endDate;
          filteredExpenses = filteredExpenses.filter((e) => e.date <= endDate);
        }

        if (filters?.taxDeductibleOnly) {
          filteredExpenses = filteredExpenses.filter((e) => e.taxDeductible);
        }

        if (filters?.categoryId) {
          filteredExpenses = filteredExpenses.filter(
            (e) => e.expenseCategoryId === filters.categoryId,
          );
        }

        if (filteredExpenses.length === 0) {
          enqueueErrorSnackBar({
            message: 'No expenses found matching the filters',
          });
          return;
        }

        // Generate file
        const csvContent = generateCSV(filteredExpenses);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `expenses_export_${timestamp}.${format}`;

        downloadFile(csvContent, filename, 'text/csv');

        enqueueSuccessSnackBar({
          message: `Exported ${filteredExpenses.length} expense(s)`,
        });
      } catch (error) {
        console.error('Error exporting expenses:', error);
        enqueueErrorSnackBar({ message: 'Failed to export expenses' });
      } finally {
        setLoading(false);
      }
    },
    [generateCSV, downloadFile, enqueueSuccessSnackBar, enqueueErrorSnackBar],
  );

  const exportTaxYear = useCallback(
    async (expenses: any[], year: number) => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      return exportExpenses(expenses, 'csv', {
        startDate,
        endDate,
        taxDeductibleOnly: true,
      });
    },
    [exportExpenses],
  );

  return {
    exportExpenses,
    exportTaxYear,
    loading,
  };
};
