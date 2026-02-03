import { useCallback } from 'react';

export const useDownloadQuotePdf = () => {
  const downloadPdf = useCallback(async (quoteId: string) => {
    try {
      const response = await fetch(
        `${window.location.origin}/pdf/quotes/${quoteId}`,
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
      link.download = `quote-${quoteId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading quote PDF:', error);
      throw error;
    }
  }, []);

  return { downloadPdf };
};
