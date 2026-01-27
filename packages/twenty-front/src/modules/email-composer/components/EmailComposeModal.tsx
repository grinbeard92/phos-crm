import { type ConnectedAccount } from '@/accounts/types/ConnectedAccount';
import { useUploadAttachmentFile } from '@/activities/files/hooks/useUploadAttachmentFile';
import { BLOCK_SCHEMA } from '@/activities/blocks/constants/Schema';
import { WorkflowSendEmailAttachments } from '@/advanced-text-editor/components/WorkflowSendEmailAttachments';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { EmailTemplateSelector } from '@/email-composer/components/EmailTemplateSelector';
import { useEmailSignature } from '@/email-composer/hooks/useEmailSignature';
import { useSendEmail } from '@/email-composer/hooks/useSendEmail';
import {
  type EmailComposeContext,
  type EmailTemplateOption,
} from '@/email-composer/types/EmailComposerTypes';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Select } from '@/ui/input/components/Select';
import { BlockEditor } from '@/ui/input/editor/components/BlockEditor';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { Modal } from '@/ui/layout/modal/components/Modal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import '@blocknote/react/style.css';
import { useState, useCallback, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  H2Title,
  IconChevronDown,
  IconChevronUp,
  IconMail,
  IconSend,
  IconX,
} from 'twenty-ui/display';
import { Button, type SelectOption } from 'twenty-ui/input';

export const EMAIL_COMPOSE_MODAL_ID = 'email-compose-modal';

const StyledModalHeader = styled(Modal.Header)`
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
  justify-content: space-between;
`;

const StyledHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledModalContent = styled(Modal.Content)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledModalFooter = styled(Modal.Footer)`
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
`;

const StyledFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledCcBccToggle = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  background: none;
  border: none;
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.font.color.secondary};
  }
`;

const StyledEditorContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  min-height: 200px;
  max-height: 400px;
  overflow: visible;
  position: relative;

  & .editor {
    min-height: 180px !important;
    padding: ${({ theme }) => theme.spacing(2, 3)} !important;
  }

  & .bn-editor {
    padding-inline: ${({ theme }) => theme.spacing(2)} !important;
  }

  & .bn-block-outer {
    margin: 0 !important;
  }
`;

const StyledEditorLabel = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.tertiary};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

type EmailAttachmentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
};

type EmailComposeModalProps = {
  context?: EmailComposeContext;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  threadId?: string;
  inReplyTo?: string;
  onClose?: () => void;
  onSendSuccess?: () => void;
};

export const EmailComposeModal = ({
  context,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
  threadId,
  onClose,
  onSendSuccess,
}: EmailComposeModalProps) => {
  const theme = useTheme();
  const { closeModal } = useModal();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { uploadAttachmentFile } = useUploadAttachmentFile();
  const { sendEmail } = useSendEmail();
  const { getSignatureForEmail } = useEmailSignature();
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);

  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [toEmail, setToEmail] = useState(
    defaultTo || context?.personEmail || '',
  );
  const [ccEmail, setCcEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [attachments, setAttachments] = useState<EmailAttachmentFile[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Initialize BlockNote editor
  const initialContent = useMemo(() => {
    if (defaultBody !== '') {
      try {
        return JSON.parse(defaultBody);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [defaultBody]);

  const handleEditorUploadFile = async (file: File) => {
    try {
      const { attachmentAbsoluteURL } = await uploadAttachmentFile(file, {
        id: crypto.randomUUID(),
        targetObjectNameSingular: CoreObjectNameSingular.Message,
      });
      return attachmentAbsoluteURL;
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to upload image: `.concat(file.name),
      });
      return '';
    }
  };

  const editor = useCreateBlockNote({
    initialContent,
    domAttributes: { editor: { class: 'editor' } },
    schema: BLOCK_SCHEMA,
    uploadFile: handleEditorUploadFile,
  });

  const handleTemplateSelect = useCallback(
    (template: EmailTemplateOption | null) => {
      if (!template) {
        setSelectedTemplateId(null);
        return;
      }

      setSelectedTemplateId(template.id);

      // Apply template with variable substitution
      let resolvedSubject = template.subject;
      let resolvedBody = template.body;

      // Simple variable substitution from context
      const variables: Record<string, string> = {
        'person.firstName': context?.personFirstName || '',
        'person.lastName': context?.personLastName || '',
        'person.email': context?.personEmail || '',
        'company.name': context?.companyName || '',
      };

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        resolvedSubject = resolvedSubject.replace(regex, value);
        resolvedBody = resolvedBody.replace(regex, value);
      });

      setSubject(resolvedSubject);

      // Try to parse and set body content in editor
      try {
        const bodyContent = JSON.parse(resolvedBody);
        if (Array.isArray(bodyContent)) {
          editor.replaceBlocks(editor.document, bodyContent);
        }
      } catch {
        // If not JSON, create a simple paragraph block
        editor.replaceBlocks(editor.document, [
          {
            type: 'paragraph',
            content: resolvedBody,
          },
        ]);
      }
    },
    [context, editor],
  );

  const { records: accounts, loading } = useFindManyRecords<ConnectedAccount>({
    objectNameSingular: 'connectedAccount',
    filter: {
      accountOwnerId: {
        eq: currentWorkspaceMember?.id,
      },
    },
    recordGqlFields: {
      id: true,
      handle: true,
      provider: true,
      scopes: true,
      accountOwnerId: true,
      connectionParameters: true,
    },
  });

  const connectedAccountOptions: SelectOption<string | null>[] = accounts
    .filter((account) => {
      if (account.provider === ConnectedAccountProvider.IMAP_SMTP_CALDAV) {
        return isDefined(account.connectionParameters?.SMTP);
      }
      return true;
    })
    .map((account) => ({
      label: account.handle,
      value: account.id,
    }));

  // Auto-select first account if only one is available
  const shouldAutoSelect =
    !loading &&
    connectedAccountOptions.length === 1 &&
    connectedAccountId === null;
  if (
    shouldAutoSelect &&
    connectedAccountOptions[0]?.value !== null &&
    connectedAccountOptions[0]?.value !== undefined
  ) {
    setConnectedAccountId(connectedAccountOptions[0].value);
  }

  const handleClose = useCallback(() => {
    onClose?.();
    closeModal(EMAIL_COMPOSE_MODAL_ID);
  }, [onClose, closeModal]);

  const handleSend = async () => {
    if (!connectedAccountId) {
      enqueueErrorSnackBar({ message: t`Please select an email account` });
      return;
    }

    if (!toEmail) {
      enqueueErrorSnackBar({ message: t`Please enter a recipient email` });
      return;
    }

    setIsSending(true);

    try {
      // Convert BlockNote content to HTML for email rendering
      // blocksToHTMLLossy() produces standard HTML that works well in email clients
      let htmlBody = await editor.blocksToHTMLLossy(editor.document);

      // Append email signature if enabled
      const signatureHtml = getSignatureForEmail();
      if (signatureHtml !== '') {
        htmlBody = htmlBody + signatureHtml;
      }

      const result = await sendEmail({
        email: toEmail,
        subject,
        body: htmlBody,
        connectedAccountId,
        files: attachments.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
        })),
      });

      if (result.success) {
        enqueueSuccessSnackBar({ message: t`Email sent successfully` });
        onSendSuccess?.();
        handleClose();
      } else {
        enqueueErrorSnackBar({
          message: t`Failed to send email: `.concat(
            result.error || t`Unknown error`,
          ),
        });
      }
    } catch (error) {
      enqueueErrorSnackBar({
        message: t`Failed to send email: `.concat(
          error instanceof Error ? error.message : t`Unknown error`,
        ),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      modalId={EMAIL_COMPOSE_MODAL_ID}
      size="large"
      padding="none"
      isClosable
      onClose={handleClose}
    >
      <StyledModalHeader>
        <StyledHeaderLeft>
          <IconMail size={theme.icon.size.md} />
          <H2Title title={threadId ? t`Reply` : t`New Email`} />
        </StyledHeaderLeft>
        <Button
          Icon={IconX}
          variant="tertiary"
          size="small"
          onClick={handleClose}
        />
      </StyledModalHeader>

      <StyledModalContent>
        {!loading && (
          <StyledFieldGroup>
            <Select
              dropdownId="email-compose-account-select"
              label={t`From`}
              fullWidth
              emptyOption={{ label: t`Select account`, value: null }}
              value={connectedAccountId}
              options={connectedAccountOptions}
              onChange={setConnectedAccountId}
              dropdownOffset={{ y: parseInt(theme.spacing(1), 10) }}
              dropdownWidth={GenericDropdownContentWidth.ExtraLarge}
            />

            <EmailTemplateSelector
              value={selectedTemplateId}
              onChange={handleTemplateSelect}
            />

            <FormTextFieldInput
              label={t`To`}
              placeholder={t`Enter recipient email`}
              defaultValue={toEmail}
              onChange={setToEmail}
            />

            <StyledCcBccToggle
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
            >
              {showCcBcc ? (
                <>
                  <IconChevronUp size={theme.icon.size.sm} />
                  <Trans>Hide CC/BCC</Trans>
                </>
              ) : (
                <>
                  <IconChevronDown size={theme.icon.size.sm} />
                  <Trans>Add CC/BCC</Trans>
                </>
              )}
            </StyledCcBccToggle>

            {showCcBcc && (
              <>
                <FormTextFieldInput
                  label={t`CC`}
                  placeholder={t`Enter CC emails (comma-separated)`}
                  defaultValue={ccEmail}
                  onChange={setCcEmail}
                />

                <FormTextFieldInput
                  label={t`BCC`}
                  placeholder={t`Enter BCC emails (comma-separated)`}
                  defaultValue={bccEmail}
                  onChange={setBccEmail}
                />
              </>
            )}

            <FormTextFieldInput
              label={t`Subject`}
              placeholder={t`Enter email subject`}
              defaultValue={subject}
              onChange={setSubject}
            />

            <div>
              <StyledEditorLabel>
                <Trans>Message</Trans>
              </StyledEditorLabel>
              <StyledEditorContainer>
                <BlockEditor editor={editor} />
              </StyledEditorContainer>
            </div>

            <WorkflowSendEmailAttachments
              label={t`Attachments`}
              files={attachments}
              onChange={setAttachments}
            />
          </StyledFieldGroup>
        )}
      </StyledModalContent>

      <StyledModalFooter>
        <Button
          title={t`Cancel`}
          variant="secondary"
          size="medium"
          onClick={handleClose}
        />
        <Button
          Icon={IconSend}
          title={isSending ? t`Sending...` : t`Send`}
          variant="primary"
          accent="blue"
          size="medium"
          onClick={handleSend}
          disabled={isSending || !connectedAccountId || !toEmail}
        />
      </StyledModalFooter>
    </Modal>
  );
};
