import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useState, useCallback } from 'react';

export type StripeSettings = {
  sandboxMode: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
};

export const useStripeSettings = () => {
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const [settings, setSettings] = useState<StripeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch Stripe settings');
      }
      const data = await response.json();
      setSettings(data);
      return data;
    } catch (error) {
      enqueueErrorSnackBar({
        message: 'Failed to load Stripe settings',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enqueueErrorSnackBar]);

  const saveSettings = useCallback(
    async (newSettings: StripeSettings) => {
      setIsSaving(true);
      try {
        const response = await fetch('/api/stripe/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        });

        if (!response.ok) {
          throw new Error('Failed to save Stripe settings');
        }

        setSettings(newSettings);
        enqueueSuccessSnackBar({
          message: 'Stripe settings saved successfully',
        });
        return true;
      } catch (error) {
        enqueueErrorSnackBar({
          message: 'Failed to save Stripe settings',
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [enqueueSuccessSnackBar, enqueueErrorSnackBar],
  );

  const testConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/stripe/settings/test', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        enqueueSuccessSnackBar({
          message: result.message,
        });
      } else {
        enqueueErrorSnackBar({
          message: result.message || 'Connection test failed',
        });
      }

      return result;
    } catch (error) {
      enqueueErrorSnackBar({
        message: 'Failed to test Stripe connection',
      });
      return { success: false, message: 'Request failed' };
    }
  }, [enqueueSuccessSnackBar, enqueueErrorSnackBar]);

  return {
    settings,
    isLoading,
    isSaving,
    fetchSettings,
    saveSettings,
    testConnection,
  };
};
