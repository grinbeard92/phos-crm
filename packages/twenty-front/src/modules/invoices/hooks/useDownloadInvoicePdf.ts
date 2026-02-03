import { useCallback } from 'react';

export const useDownloadInvoicePdf = () => {
  const downloadPdf = useCallback(async (invoiceId: string) => {
    try {
      const response = await fetch(
        `${window.location.origin}/pdf/invoices/${invoiceId}`,
        {
          method: 'GET',
          credentials: 'include', // Include auth cookies
        },
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }, []);

  return { downloadPdf };
};
