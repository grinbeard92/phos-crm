import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { Form, useParams, useSearchParams } from 'react-router-dom';

import { isConfigVariablesInDbEnabledState } from '@/client-config/states/isConfigVariablesInDbEnabledState';
import { ConfigVariableHelpText } from '@/settings/admin-panel/config-variables/components/ConfigVariableHelpText';
import { ConfigVariableValueInput } from '@/settings/admin-panel/config-variables/components/ConfigVariableValueInput';
import { useConfigVariableActions } from '@/settings/admin-panel/config-variables/hooks/useConfigVariableActions';
import { useConfigVariableForm } from '@/settings/admin-panel/config-variables/hooks/useConfigVariableForm';
import { useTriggerAdminGmailOAuth } from '@/settings/admin-panel/config-variables/hooks/useTriggerAdminGmailOAuth';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSkeletonLoader } from '@/settings/components/SettingsSkeletonLoader';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { useRecoilValue } from 'recoil';
import { SettingsPath, type ConfigVariableValue } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import {
  H3Title,
  IconCheck,
  IconGoogle,
  IconPencil,
  IconX,
} from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import {
  ConfigSource,
  useGetDatabaseConfigVariableQuery,
} from '~/generated-metadata/graphql';

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const StyledH3Title = styled(H3Title)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledButtonContainer = styled.div`
  display: flex;
  & > :not(:first-of-type) > button {
    border-left: none;
  }
`;

const StyledOAuthSection = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(4)};
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const StyledOAuthTitle = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledOAuthDescription = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const StyledSuccessMessage = styled.div`
  background: ${({ theme }) => theme.color.green10};
  border: 1px solid ${({ theme }) => theme.color.green5};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.color.green};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledErrorMessage = styled.div`
  background: ${({ theme }) => theme.color.red10};
  border: 1px solid ${({ theme }) => theme.color.red5};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const RESET_VARIABLE_MODAL_ID = 'reset-variable-modal';

// Config variables that support OAuth flow
const GMAIL_OAUTH_CONFIG_VARIABLE = 'EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN';

export const SettingsAdminConfigVariableDetails = () => {
  const { variableName } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useLingui();
  const [isEditing, setIsEditing] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const { openModal } = useModal();
  const isConfigVariablesInDbEnabled = useRecoilValue(
    isConfigVariablesInDbEnabledState,
  );
  const { triggerAdminGmailOAuth } = useTriggerAdminGmailOAuth();

  // Check for success/error messages from OAuth callback
  const successMessage = searchParams.get('success');
  const errorMessage = searchParams.get('error');

  const isGmailOAuthVariable = variableName === GMAIL_OAUTH_CONFIG_VARIABLE;

  const { data: configVariableData, loading } =
    useGetDatabaseConfigVariableQuery({
      variables: { key: variableName ?? '' },
      fetchPolicy: 'network-only',
    });

  const variable = configVariableData?.getDatabaseConfigVariable;

  const { handleUpdateVariable, handleDeleteVariable } =
    useConfigVariableActions(variable?.name ?? '');

  const {
    handleSubmit,
    setValue,
    isSubmitting,
    watch,
    hasValueChanged,
    isValueValid,
  } = useConfigVariableForm(variable);

  const handleGmailOAuthClick = useCallback(async () => {
    setIsOAuthLoading(true);
    try {
      await triggerAdminGmailOAuth();
    } catch {
      setIsOAuthLoading(false);
    }
  }, [triggerAdminGmailOAuth]);

  if (loading === true || isDefined(variable) === false) {
    return <SettingsSkeletonLoader />;
  }

  const isEnvOnly = variable.isEnvOnly;
  const isFromDatabase = variable.source === ConfigSource.DATABASE;

  const onSubmit = async (formData: { value: ConfigVariableValue }) => {
    await handleUpdateVariable(formData.value, isFromDatabase);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleXButtonClick = () => {
    if (isFromDatabase && hasValueChanged) {
      setValue('value', variable.value);
      setIsEditing(false);
      return;
    }

    if (isFromDatabase && !hasValueChanged) {
      openModal(RESET_VARIABLE_MODAL_ID);
      return;
    }

    setValue('value', variable.value);
    setIsEditing(false);
  };

  const handleConfirmReset = () => {
    handleDeleteVariable();
    setIsEditing(false);
  };

  return (
    <>
      <SubMenuTopBarContainer
        links={[
          {
            children: t`Other`,
            href: getSettingsPath(SettingsPath.AdminPanel),
          },
          {
            children: t`Admin Panel`,
            href: getSettingsPath(SettingsPath.AdminPanel),
          },
          {
            children: t`Config Variables`,
            href: getSettingsPath(
              SettingsPath.AdminPanel,
              undefined,
              undefined,
              'config-variables',
            ),
          },
          {
            children: variable.name,
          },
        ]}
      >
        <SettingsPageContainer>
          {successMessage && (
            <StyledSuccessMessage>{successMessage}</StyledSuccessMessage>
          )}
          {errorMessage && (
            <StyledErrorMessage>{errorMessage}</StyledErrorMessage>
          )}

          <StyledH3Title
            title={variable.name}
            description={variable.description}
          />

          <StyledForm onSubmit={handleSubmit(onSubmit)}>
            <StyledRow>
              <ConfigVariableValueInput
                variable={variable}
                value={watch('value')}
                onChange={(value) => setValue('value', value)}
                disabled={isEnvOnly || !isEditing}
              />

              {!isEditing ? (
                <Button
                  Icon={IconPencil}
                  variant="primary"
                  onClick={handleEditClick}
                  type="button"
                  disabled={isEnvOnly || !isConfigVariablesInDbEnabled}
                />
              ) : (
                <StyledButtonContainer>
                  <Button
                    Icon={IconCheck}
                    variant="secondary"
                    position="left"
                    type="submit"
                    disabled={isSubmitting || !isValueValid || !hasValueChanged}
                  />
                  <Button
                    Icon={IconX}
                    variant="secondary"
                    position="right"
                    onClick={handleXButtonClick}
                    type="button"
                    disabled={isSubmitting}
                  />
                </StyledButtonContainer>
              )}
            </StyledRow>

            <ConfigVariableHelpText
              variable={variable}
              hasValueChanged={hasValueChanged}
            />
          </StyledForm>

          {isGmailOAuthVariable && (
            <StyledOAuthSection>
              <StyledOAuthTitle>{t`Authorize with Google`}</StyledOAuthTitle>
              <StyledOAuthDescription>
                {t`Click the button below to authorize Gmail OAuth2 for system emails. This will open a Google authorization page where you can grant access. The refresh token will be automatically saved after authorization.`}
              </StyledOAuthDescription>
              <Button
                Icon={IconGoogle}
                title={t`Authorize with Google`}
                variant="secondary"
                accent="blue"
                onClick={handleGmailOAuthClick}
                disabled={isOAuthLoading || !isConfigVariablesInDbEnabled}
              />
            </StyledOAuthSection>
          )}
        </SettingsPageContainer>
      </SubMenuTopBarContainer>

      <ConfirmationModal
        modalId={RESET_VARIABLE_MODAL_ID}
        title={t`Reset variable`}
        subtitle={t`This will revert the database value to environment/default value. The database override will be removed and the system will use the environment settings.`}
        onConfirmClick={handleConfirmReset}
        confirmButtonText={t`Reset`}
        confirmButtonAccent="danger"
      />
    </>
  );
};
