import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export const SendInvoiceEmailAction = () => {
  const { enqueueInfoSnackBar } = useSnackBar();
  const recordId = useSelectedRecordIdOrThrow();

  // TODO: Integrate with email composer (Epic 002 - Story 2.5)
  // This is a placeholder implementation
  enqueueInfoSnackBar({
    message: `Email composer integration pending for invoice ${recordId}`,
  });

  return null;
};
