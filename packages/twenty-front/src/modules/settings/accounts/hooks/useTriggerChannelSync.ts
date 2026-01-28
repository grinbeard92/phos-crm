import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { useCallback } from 'react';
import { useStartChannelSyncMutation } from '~/generated-metadata/graphql';

export const useTriggerChannelSync = () => {
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const [startChannelSyncMutation, { loading: isLoading }] =
    useStartChannelSyncMutation();

  const triggerChannelSync = useCallback(
    async (connectedAccountId: string) => {
      await startChannelSyncMutation({
        variables: {
          connectedAccountId,
        },
        onCompleted: () => {
          enqueueSuccessSnackBar({
            message: t`Email sync triggered. Messages will be imported shortly.`,
          });
        },
        onError: (error) => {
          enqueueErrorSnackBar({
            apolloError: error,
          });
        },
      });
    },
    [startChannelSyncMutation, enqueueSuccessSnackBar, enqueueErrorSnackBar],
  );

  return { triggerChannelSync, isLoading };
};
