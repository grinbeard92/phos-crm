import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import {
  BUILT_IN_VARIABLES,
  type CustomTemplateVariable,
  customTemplateVariablesState,
} from '@/email-composer/states/emailComposerSettingsState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { TextInput } from '@/ui/input/components/TextInput';
import { H2Title, IconPlus, IconTrash, IconVariable } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';

const StyledVariableList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledVariableCard = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledVariableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledVariableKey = styled.code`
  background: ${({ theme }) => theme.background.tertiary};
  border-radius: ${({ theme }) => theme.border.radius.xs};
  color: ${({ theme }) => theme.font.color.primary};
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: ${({ theme }) => theme.font.size.sm};
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
`;

const StyledVariableLabel = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

const StyledBuiltInSection = styled.div`
  background: ${({ theme }) => theme.background.tertiary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  margin-top: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledBuiltInTitle = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledBuiltInList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
`;

const StyledBuiltInItem = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const StyledBuiltInKey = styled.code`
  color: ${({ theme }) => theme.color.blue};
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledBuiltInLabel = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const StyledBuiltInDescription = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const StyledEditorForm = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledFormRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledEmptyState = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  padding: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const StyledAddButtonContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const StyledEmptyIcon = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledCustomVariableRow = styled.div`
  align-items: end;
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: 1fr 1fr 1fr auto;
`;

export const EmailTemplateVariablesManager = () => {
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const workspaceId = currentWorkspace?.id ?? 'default';
  const { enqueueSuccessSnackBar } = useSnackBar();

  const [customVariables, setCustomVariables] = useRecoilState(
    customTemplateVariablesState(workspaceId),
  );

  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDefaultValue, setNewDefaultValue] = useState('');

  const handleAddVariable = useCallback(() => {
    if (!newKey.trim() || !newLabel.trim()) {
      return;
    }

    // Sanitize key to be a valid variable name
    const sanitizedKey = newKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    const newVariable: CustomTemplateVariable = {
      id: uuidv4(),
      key: sanitizedKey,
      label: newLabel.trim(),
      defaultValue: newDefaultValue.trim(),
    };

    setCustomVariables([...customVariables, newVariable]);
    setNewKey('');
    setNewLabel('');
    setNewDefaultValue('');
    setIsAdding(false);
    enqueueSuccessSnackBar({ message: t`Variable added` });
  }, [
    customVariables,
    enqueueSuccessSnackBar,
    newDefaultValue,
    newKey,
    newLabel,
    setCustomVariables,
  ]);

  const handleDeleteVariable = useCallback(
    (id: string) => {
      setCustomVariables(customVariables.filter((v) => v.id !== id));
      enqueueSuccessSnackBar({ message: t`Variable deleted` });
    },
    [customVariables, enqueueSuccessSnackBar, setCustomVariables],
  );

  const handleUpdateVariable = useCallback(
    (id: string, updates: Partial<CustomTemplateVariable>) => {
      setCustomVariables(
        customVariables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      );
    },
    [customVariables, setCustomVariables],
  );

  return (
    <Section>
      <H2Title
        title={t`Template Variables`}
        description={t`Manage variables you can use in email templates. Use {{variableName}} syntax.`}
      />

      {/* Built-in Variables Reference */}
      <StyledBuiltInSection>
        <StyledBuiltInTitle>
          <Trans>Built-in Variables</Trans>
        </StyledBuiltInTitle>
        <StyledBuiltInList>
          {BUILT_IN_VARIABLES.map((variable) => (
            <StyledBuiltInItem key={variable.key}>
              <StyledBuiltInLabel>{variable.label}</StyledBuiltInLabel>
              <StyledBuiltInKey>{`{{${variable.key}}}`}</StyledBuiltInKey>
              <StyledBuiltInDescription>
                {variable.description}
              </StyledBuiltInDescription>
            </StyledBuiltInItem>
          ))}
        </StyledBuiltInList>
      </StyledBuiltInSection>

      {/* Add New Variable Form */}
      {isAdding ? (
        <StyledEditorForm>
          <StyledFormRow>
            <TextInput
              label={t`Variable Key`}
              value={newKey}
              onChange={setNewKey}
              placeholder={t`e.g., productName`}
              fullWidth
            />
          </StyledFormRow>
          <StyledFormRow>
            <TextInput
              label={t`Display Label`}
              value={newLabel}
              onChange={setNewLabel}
              placeholder={t`e.g., Product Name`}
              fullWidth
            />
          </StyledFormRow>
          <StyledFormRow>
            <TextInput
              label={t`Default Value`}
              value={newDefaultValue}
              onChange={setNewDefaultValue}
              placeholder={t`e.g., Our Product`}
              fullWidth
            />
          </StyledFormRow>
          <StyledButtonRow>
            <Button
              title={t`Add Variable`}
              variant="primary"
              accent="blue"
              size="small"
              onClick={handleAddVariable}
              disabled={!newKey.trim() || !newLabel.trim()}
            />
            <Button
              title={t`Cancel`}
              variant="secondary"
              size="small"
              onClick={() => setIsAdding(false)}
            />
          </StyledButtonRow>
        </StyledEditorForm>
      ) : (
        <StyledAddButtonContainer>
          <Button
            Icon={IconPlus}
            title={t`Add Custom Variable`}
            variant="secondary"
            size="small"
            onClick={() => setIsAdding(true)}
          />
        </StyledAddButtonContainer>
      )}

      {/* Custom Variables List */}
      <StyledVariableList>
        {customVariables.length === 0 ? (
          <StyledEmptyState>
            <StyledEmptyIcon>
              <IconVariable size={24} />
            </StyledEmptyIcon>
            <Trans>
              No custom variables yet. Add variables to use in your email
              templates.
            </Trans>
          </StyledEmptyState>
        ) : (
          customVariables.map((variable) => (
            <StyledVariableCard key={variable.id}>
              <StyledVariableHeader>
                <div>
                  <StyledVariableLabel>{variable.label}</StyledVariableLabel>
                  <StyledVariableKey>{`{{custom.${variable.key}}}`}</StyledVariableKey>
                </div>
                <Button
                  Icon={IconTrash}
                  variant="tertiary"
                  size="small"
                  onClick={() => handleDeleteVariable(variable.id)}
                />
              </StyledVariableHeader>
              <StyledCustomVariableRow>
                <TextInput
                  label={t`Key`}
                  value={variable.key}
                  onChange={(value) =>
                    handleUpdateVariable(variable.id, {
                      key: value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    })
                  }
                  fullWidth
                />
                <TextInput
                  label={t`Label`}
                  value={variable.label}
                  onChange={(value) =>
                    handleUpdateVariable(variable.id, { label: value })
                  }
                  fullWidth
                />
                <TextInput
                  label={t`Default Value`}
                  value={variable.defaultValue}
                  onChange={(value) =>
                    handleUpdateVariable(variable.id, { defaultValue: value })
                  }
                  fullWidth
                />
              </StyledCustomVariableRow>
            </StyledVariableCard>
          ))
        )}
      </StyledVariableList>
    </Section>
  );
};
