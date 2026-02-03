import { useCallback } from 'react';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const DownloadQuotePdfActionEffect = () => {
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const recordId = useSelectedRecordIdOrThrow();

  const handleDownloadPdf = useCallback(async () => {
    try {
      const response = await fetch(
        `${window.location.origin}/pdf/quotes/${recordId}`,
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
      link.download = `quote-${recordId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      enqueueSuccessSnackBar({ message: 'PDF downloaded successfully' });
    } catch (error) {
      console.error('Error downloading quote PDF:', error);
      enqueueErrorSnackBar({ message: 'Failed to download PDF' });
    }
  }, [recordId, enqueueSuccessSnackBar, enqueueErrorSnackBar]);

  // Execute on mount
  handleDownloadPdf();

  return null;
};
