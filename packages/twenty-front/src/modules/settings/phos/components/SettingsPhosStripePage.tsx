import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useStripeSettings } from '@/settings/phos/hooks/useStripeSettings';
import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Section } from 'twenty-ui/layout';
import { H2Title } from 'twenty-ui/display';
import { Button, Toggle } from 'twenty-ui/input';

const StyledFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const StyledFormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const StyledHelperText = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.tertiary};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

export const SettingsPhosStripePage = () => {
  const { settings, isLoading, isSaving, fetchSettings, saveSettings, testConnection } = useStripeSettings();
  const [formData, setFormData] = useState({
    sandboxMode: true,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        sandboxMode: settings.sandboxMode,
        publishableKey: settings.publishableKey || '',
        secretKey: settings.secretKey || '',
        webhookSecret: settings.webhookSecret || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings(formData);
  };

  const handleTest = async () => {
    await testConnection();
  };

  if (isLoading) {
    return (
      <SettingsPageContainer>
        <H2Title title="Stripe Configuration" />
        <div>Loading...</div>
      </SettingsPageContainer>
    );
  }

  return (
    <SettingsPageContainer>
      <Section>
        <H2Title title="Stripe Configuration" description="Configure Stripe integration for payment processing" />
        <StyledFormContainer>
          <StyledToggleRow>
            <div>
              <StyledLabel>Sandbox Mode</StyledLabel>
              <StyledHelperText>
                Use test API keys (pk_test_... and sk_test_...)
              </StyledHelperText>
            </div>
            <Toggle
              value={formData.sandboxMode}
              onChange={(value: boolean) => setFormData({ ...formData, sandboxMode: value })}
            />
          </StyledToggleRow>

          <StyledFormRow>
            <StyledLabel>Publishable Key</StyledLabel>
            <SettingsTextInput
              instanceId="stripe-publishable-key"
              placeholder="pk_test_... or pk_live_..."
              value={formData.publishableKey}
              onChange={(value) => setFormData({ ...formData, publishableKey: value })}
            />
          </StyledFormRow>

          <StyledFormRow>
            <StyledLabel>Secret Key</StyledLabel>
            <SettingsTextInput
              instanceId="stripe-secret-key"
              placeholder="sk_test_... or sk_live_..."
              value={formData.secretKey}
              onChange={(value) => setFormData({ ...formData, secretKey: value })}
              type="password"
            />
          </StyledFormRow>

          <StyledFormRow>
            <StyledLabel>Webhook Secret</StyledLabel>
            <SettingsTextInput
              instanceId="stripe-webhook-secret"
              placeholder="whsec_..."
              value={formData.webhookSecret}
              onChange={(value) => setFormData({ ...formData, webhookSecret: value })}
              type="password"
            />
          </StyledFormRow>

          <StyledButtonContainer>
            <Button
              title="Save Settings"
              onClick={handleSave}
              disabled={isSaving}
              variant="primary"
            />
            <Button
              title="Test Connection"
              onClick={handleTest}
              variant="secondary"
            />
          </StyledButtonContainer>
        </StyledFormContainer>
      </Section>
    </SettingsPageContainer>
  );
};
