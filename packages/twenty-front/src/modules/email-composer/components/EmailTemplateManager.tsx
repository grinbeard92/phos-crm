import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { useEmailTemplates } from '@/email-composer/hooks/useEmailTemplates';
import { type LocalEmailTemplate } from '@/email-composer/states/emailComposerSettingsState';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';
import { H2Title, IconPencil, IconPlus, IconTrash } from 'twenty-ui/display';
import { Button, type SelectOption } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';

const StyledTemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledTemplateCard = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.light};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledTemplateHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledTemplateName = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledTemplateSubject = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledTemplateCategory = styled.span`
  background: ${({ theme }) => theme.background.tertiary};
  border-radius: ${({ theme }) => theme.border.radius.xs};
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  text-transform: uppercase;
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledEmptyState = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  padding: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const StyledEditorModal = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(4)};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledEditorTitle = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const StyledFormRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const StyledLabel = styled.label`
  color: ${({ theme }) => theme.font.color.secondary};
  display: block;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledTextArea = styled.textarea`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.font.color.primary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.font.size.sm};
  min-height: 150px;
  padding: ${({ theme }) => theme.spacing(2)};
  resize: vertical;
  width: 100%;

  &:focus {
    border-color: ${({ theme }) => theme.color.blue};
    outline: none;
  }
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledVariablesHelp = styled.div`
  background: ${({ theme }) => theme.background.tertiary};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const CATEGORY_OPTIONS: SelectOption<LocalEmailTemplate['category']>[] = [
  { label: 'General', value: 'GENERAL' },
  { label: 'Sales', value: 'SALES' },
  { label: 'Support', value: 'SUPPORT' },
  { label: 'Follow Up', value: 'FOLLOW_UP' },
];

type TemplateEditorProps = {
  template?: LocalEmailTemplate;
  onSave: (
    template: Omit<LocalEmailTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  onCancel: () => void;
};

const TemplateEditor = ({ template, onSave, onCancel }: TemplateEditorProps) => {
  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [body, setBody] = useState(template?.body ?? '');
  const [category, setCategory] = useState<LocalEmailTemplate['category']>(
    template?.category ?? 'GENERAL',
  );

  const handleSave = () => {
    if (!name.trim() || !subject.trim()) {
      return;
    }
    onSave({
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      category,
      isActive: template?.isActive ?? true,
    });
  };

  return (
    <StyledEditorModal>
      <StyledEditorTitle>
        {template ? <Trans>Edit Template</Trans> : <Trans>New Template</Trans>}
      </StyledEditorTitle>

      <StyledFormRow>
        <StyledLabel>{t`Template Name`}</StyledLabel>
        <TextInput
          value={name}
          onChange={setName}
          placeholder={t`e.g., Follow Up Email`}
          fullWidth
        />
      </StyledFormRow>

      <StyledFormRow>
        <StyledLabel>{t`Subject Line`}</StyledLabel>
        <TextInput
          value={subject}
          onChange={setSubject}
          placeholder={t`e.g., Following up on our conversation`}
          fullWidth
        />
      </StyledFormRow>

      <StyledFormRow>
        <StyledLabel>{t`Category`}</StyledLabel>
        <Select
          dropdownId="template-category-select"
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={setCategory}
          fullWidth
        />
      </StyledFormRow>

      <StyledFormRow>
        <StyledLabel>{t`Email Body (HTML)`}</StyledLabel>
        <StyledTextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t`<p>Hi {{person.firstName}},</p>\n<p>Your email content here...</p>`}
        />
        <StyledVariablesHelp>
          <Trans>
            Available variables: {'{{person.firstName}}'},{' '}
            {'{{person.lastName}}'}, {'{{person.email}}'}, {'{{company.name}}'}
          </Trans>
        </StyledVariablesHelp>
      </StyledFormRow>

      <StyledButtonRow>
        <Button
          title={t`Save Template`}
          variant="primary"
          accent="blue"
          size="small"
          onClick={handleSave}
          disabled={!name.trim() || !subject.trim()}
        />
        <Button
          title={t`Cancel`}
          variant="secondary"
          size="small"
          onClick={onCancel}
        />
      </StyledButtonRow>
    </StyledEditorModal>
  );
};

export const EmailTemplateManager = () => {
  const { allTemplates, createTemplate, updateTemplate, deleteTemplate } =
    useEmailTemplates();

  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<
    LocalEmailTemplate | undefined
  >();

  const handleCreate = useCallback(() => {
    setEditingTemplate(undefined);
    setIsEditing(true);
  }, []);

  const handleEdit = useCallback((template: LocalEmailTemplate) => {
    setEditingTemplate(template);
    setIsEditing(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm(t`Are you sure you want to delete this template?`)) {
        deleteTemplate(id);
      }
    },
    [deleteTemplate],
  );

  const handleSave = useCallback(
    (
      templateData: Omit<LocalEmailTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
      if (editingTemplate) {
        updateTemplate(editingTemplate.id, templateData);
      } else {
        createTemplate(templateData);
      }
      setIsEditing(false);
      setEditingTemplate(undefined);
    },
    [editingTemplate, createTemplate, updateTemplate],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditingTemplate(undefined);
  }, []);

  const handleToggleActive = useCallback(
    (template: LocalEmailTemplate) => {
      updateTemplate(template.id, { isActive: !template.isActive });
    },
    [updateTemplate],
  );

  return (
    <Section>
      <H2Title
        title={t`Email Templates`}
        description={t`Create and manage reusable email templates with dynamic variables.`}
      />

      {isEditing && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {!isEditing && (
        <Button
          Icon={IconPlus}
          title={t`Create Template`}
          variant="secondary"
          size="small"
          onClick={handleCreate}
        />
      )}

      <StyledTemplateList style={{ marginTop: '16px' }}>
        {allTemplates.length === 0 ? (
          <StyledEmptyState>
            <Trans>
              No templates yet. Create your first template to get started.
            </Trans>
          </StyledEmptyState>
        ) : (
          allTemplates.map((template) => (
            <StyledTemplateCard
              key={template.id}
              style={{ opacity: template.isActive ? 1 : 0.6 }}
            >
              <StyledTemplateHeader>
                <div>
                  <StyledTemplateName>{template.name}</StyledTemplateName>
                  <StyledTemplateCategory>
                    {template.category.replace('_', ' ')}
                  </StyledTemplateCategory>
                </div>
                <StyledActions>
                  <Button
                    Icon={IconPencil}
                    variant="tertiary"
                    size="small"
                    onClick={() => handleEdit(template)}
                  />
                  <Button
                    Icon={IconTrash}
                    variant="tertiary"
                    size="small"
                    onClick={() => handleDelete(template.id)}
                  />
                </StyledActions>
              </StyledTemplateHeader>
              <StyledTemplateSubject>{template.subject}</StyledTemplateSubject>
              <Button
                title={template.isActive ? t`Disable` : t`Enable`}
                variant="tertiary"
                size="small"
                onClick={() => handleToggleActive(template)}
              />
            </StyledTemplateCard>
          ))
        )}
      </StyledTemplateList>
    </Section>
  );
};
