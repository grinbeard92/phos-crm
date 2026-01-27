import { type ConnectedAccount } from '@/accounts/types/ConnectedAccount';
import { BLOCK_SCHEMA } from '@/activities/blocks/constants/Schema';
import { WorkflowSendEmailAttachments } from '@/advanced-text-editor/components/WorkflowSendEmailAttachments';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { EmailTemplateSelector } from '@/email-composer/components/EmailTemplateSelector';
import { useEmailSignature } from '@/email-composer/hooks/useEmailSignature';
import DOMPurify from 'dompurify';
import { useSendEmail } from '@/email-composer/hooks/useSendEmail';
import { useUploadEmailImage } from '@/email-composer/hooks/useUploadEmailImage';
import {
  type EmailComposeContext,
  type EmailTemplateOption,
} from '@/email-composer/types/EmailComposerTypes';
import {
  customTemplateVariablesState,
  defaultEditorModeState,
  emailComposeModalOptionsState,
  type EditorMode,
} from '@/email-composer/states/emailComposerSettingsState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';
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
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  H2Title,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconMail,
  IconSend,
  IconTextSize,
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

const StyledSignaturePreview = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  margin-top: ${({ theme }) => theme.spacing(3)};
  padding-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledSignatureLabel = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledSignatureContent = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: 1.5;

  p {
    margin: 0 0 ${({ theme }) => theme.spacing(2)};
  }
`;

const StyledEditorModeToggle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledModeButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  background: ${({ theme, isActive }) =>
    isActive ? theme.background.tertiary : 'transparent'};
  border: 1px solid
    ${({ theme, isActive }) =>
      isActive ? theme.border.color.medium : 'transparent'};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme, isActive }) =>
    isActive ? theme.font.color.primary : theme.font.color.tertiary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.font.size.xs};
  padding: ${({ theme }) => theme.spacing(1, 2)};

  &:hover {
    background: ${({ theme }) => theme.background.tertiary};
    color: ${({ theme }) => theme.font.color.primary};
  }
`;

const StyledHtmlTextArea = styled.textarea`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  color: ${({ theme }) => theme.font.color.primary};
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: ${({ theme }) => theme.font.size.sm};
  min-height: 200px;
  padding: ${({ theme }) => theme.spacing(2)};
  resize: vertical;
  width: 100%;

  &:focus {
    border-color: ${({ theme }) => theme.color.blue};
    outline: none;
  }
`;

const StyledMessageHistory = styled.div`
  background: ${({ theme }) => theme.background.tertiary};
  border: 1px solid ${({ theme }) => theme.border.color.light};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  margin-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledMessageHistoryHeader = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${({ theme }) => theme.font.color.tertiary};
  cursor: pointer;
  display: flex;
  font-size: ${({ theme }) => theme.font.size.sm};
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2, 3)};
  width: 100%;

  &:hover {
    color: ${({ theme }) => theme.font.color.secondary};
  }
`;

const StyledMessageHistoryContent = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(3)};

  blockquote {
    border-left: 2px solid ${({ theme }) => theme.border.color.medium};
    color: ${({ theme }) => theme.font.color.tertiary};
    margin: ${({ theme }) => theme.spacing(2, 0)};
    padding-left: ${({ theme }) => theme.spacing(2)};
  }
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
  /** Previous message content for replies (HTML) */
  quotedMessageHtml?: string;
  /** When true, hides template selector and optimizes UI for direct replies */
  isReply?: boolean;
  /** References header for email threading (chain of Message-IDs) */
  references?: string[];
  onClose?: () => void;
  onSendSuccess?: () => void;
};

export const EmailComposeModal = ({
  context: propsContext,
  defaultTo: propsDefaultTo,
  defaultSubject: propsDefaultSubject,
  defaultBody: propsDefaultBody,
  threadId: propsThreadId,
  inReplyTo: propsInReplyTo,
  quotedMessageHtml: propsQuotedMessageHtml,
  isReply: propsIsReply,
  references: propsReferences,
  onClose: propsOnClose,
  onSendSuccess: propsOnSendSuccess,
}: EmailComposeModalProps) => {
  // Read options from recoil state (set by useEmailComposer hook)
  const emailComposeModalOptions = useRecoilValue(
    emailComposeModalOptionsState,
  );
  const setEmailComposeModalOptions = useSetRecoilState(
    emailComposeModalOptionsState,
  );

  // Merge props with modal options (props take precedence)
  const context = propsContext ?? emailComposeModalOptions.context;
  const defaultTo = propsDefaultTo ?? emailComposeModalOptions.defaultTo ?? '';
  const defaultSubject =
    propsDefaultSubject ?? emailComposeModalOptions.defaultSubject ?? '';
  const defaultBody =
    propsDefaultBody ?? emailComposeModalOptions.defaultBody ?? '';
  const threadId = propsThreadId ?? emailComposeModalOptions.threadId;
  const inReplyTo = propsInReplyTo ?? emailComposeModalOptions.inReplyTo;
  const quotedMessageHtml =
    propsQuotedMessageHtml ?? emailComposeModalOptions.quotedMessageHtml;
  const isReply = propsIsReply ?? emailComposeModalOptions.isReply ?? false;
  const references = propsReferences ?? emailComposeModalOptions.references;
  const onClose = propsOnClose ?? emailComposeModalOptions.onClose;
  const onSendSuccess =
    propsOnSendSuccess ?? emailComposeModalOptions.onSendSuccess;

  const theme = useTheme();
  const { closeModal } = useModal();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { uploadEmailImage } = useUploadEmailImage();
  const { sendEmail } = useSendEmail();
  const {
    signature,
    includeSignature,
    showSignaturePreview,
    getSignatureForEmail,
  } = useEmailSignature();
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const memberId = currentWorkspaceMember?.id ?? 'default';
  const workspaceId = currentWorkspace?.id ?? 'default';

  // Custom template variables
  const customVariables = useRecoilValue(
    customTemplateVariablesState(workspaceId),
  );

  // Editor mode preference
  const [defaultEditorMode, setDefaultEditorMode] = useRecoilState(
    defaultEditorModeState(memberId),
  );
  const [editorMode, setEditorMode] = useState<EditorMode>(defaultEditorMode);
  const [htmlContent, setHtmlContent] = useState('');
  const [showMessageHistory, setShowMessageHistory] = useState(false);

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

  // Sanitize signature for preview rendering
  const sanitizedSignature = useMemo(
    () => (signature ? DOMPurify.sanitize(signature) : ''),
    [signature],
  );

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
      const imageUrl = await uploadEmailImage(file);
      return imageUrl;
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
    async (template: EmailTemplateOption | null) => {
      if (!template) {
        setSelectedTemplateId(null);
        return;
      }

      setSelectedTemplateId(template.id);

      // Apply template with variable substitution
      let resolvedSubject = template.subject;
      let resolvedBody = template.body;

      // Build variables map with built-in and custom variables
      const variables: Record<string, string> = {
        // Recipient info from context
        'person.firstName': context?.personFirstName ?? '',
        'person.lastName': context?.personLastName ?? '',
        'person.email': context?.personEmail ?? '',
        'company.name': context?.companyName ?? '',
        // Sender's company (workspace name)
        'myCompany.name': currentWorkspace?.displayName ?? '',
        // Sender info
        'sender.firstName': currentWorkspaceMember?.name?.firstName ?? '',
        'sender.lastName': currentWorkspaceMember?.name?.lastName ?? '',
        'sender.email': currentWorkspaceMember?.userEmail ?? '',
      };

      // Add custom variables with their default values
      for (const customVar of customVariables) {
        variables[`custom.${customVar.key}`] = customVar.defaultValue;
      }

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        resolvedSubject = resolvedSubject.replace(regex, value);
        resolvedBody = resolvedBody.replace(regex, value);
      });

      setSubject(resolvedSubject);

      // Apply body to current editor mode
      if (editorMode === 'html') {
        setHtmlContent(resolvedBody);
      } else {
        // Try to parse and set body content in editor
        try {
          const bodyContent = JSON.parse(resolvedBody);
          if (Array.isArray(bodyContent)) {
            editor.replaceBlocks(editor.document, bodyContent);
          }
        } catch {
          // If not JSON, it's HTML - parse it to blocks
          const blocks = await editor.tryParseHTMLToBlocks(resolvedBody);
          editor.replaceBlocks(editor.document, blocks);
        }
      }
    },
    [
      context,
      currentWorkspace?.displayName,
      currentWorkspaceMember?.name?.firstName,
      currentWorkspaceMember?.name?.lastName,
      currentWorkspaceMember?.userEmail,
      customVariables,
      editor,
      editorMode,
    ],
  );

  // Handle switching between editor modes
  const handleEditorModeChange = useCallback(
    async (newMode: EditorMode) => {
      if (newMode === editorMode) return;

      if (newMode === 'html') {
        // Convert rich editor content to HTML
        const html = await editor.blocksToHTMLLossy(editor.document);
        setHtmlContent(html);
      } else {
        // Convert HTML to rich editor blocks
        if (htmlContent !== '') {
          const blocks = await editor.tryParseHTMLToBlocks(htmlContent);
          editor.replaceBlocks(editor.document, blocks);
        }
      }

      setEditorMode(newMode);
      setDefaultEditorMode(newMode);
    },
    [editor, editorMode, htmlContent, setDefaultEditorMode],
  );

  // Sanitize quoted message for safe rendering
  const sanitizedQuotedMessage = useMemo(
    () => (quotedMessageHtml ? DOMPurify.sanitize(quotedMessageHtml) : ''),
    [quotedMessageHtml],
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
    // Clear modal options state to prevent stale data on next open
    setEmailComposeModalOptions({});
    closeModal(EMAIL_COMPOSE_MODAL_ID);
  }, [onClose, closeModal, setEmailComposeModalOptions]);

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
      // Get email body based on editor mode
      let htmlBody: string;
      if (editorMode === 'html') {
        htmlBody = htmlContent;
      } else {
        // Convert BlockNote content to HTML for email rendering
        htmlBody = await editor.blocksToHTMLLossy(editor.document);
      }

      // Append email signature if enabled
      const signatureHtml = getSignatureForEmail();
      if (signatureHtml !== '') {
        htmlBody = htmlBody + signatureHtml;
      }

      // For replies, include quoted message after signature
      if (isDefined(threadId) && isDefined(quotedMessageHtml)) {
        // Email HTML requires inline styles for compatibility across email clients
        /* eslint-disable twenty/no-hardcoded-colors, lingui/no-unlocalized-strings */
        const quoteStyle =
          'border-left: 2px solid rgb(204, 204, 204); padding-left: 12px; margin-left: 0; color: rgb(102, 102, 102);';
        /* eslint-enable twenty/no-hardcoded-colors, lingui/no-unlocalized-strings */
        htmlBody =
          htmlBody +
          `<br><br><blockquote style="${quoteStyle}">` +
          quotedMessageHtml +
          '</blockquote>';
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
        // Threading support for email replies
        ...(inReplyTo !== undefined && { inReplyTo }),
        ...(references !== undefined &&
          references.length > 0 && { references }),
        ...(threadId !== undefined && { messageThreadId: threadId }),
        // Additional recipients
        ...(ccEmail !== '' && { cc: ccEmail }),
        ...(bccEmail !== '' && { bcc: bccEmail }),
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
      ignoreContainer
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
              isDropdownInModal
            />

            {!isReply && (
              <EmailTemplateSelector
                value={selectedTemplateId}
                onChange={handleTemplateSelect}
              />
            )}

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

            <TextInput
              label={t`Subject`}
              placeholder={t`Enter email subject`}
              value={subject}
              onChange={setSubject}
              fullWidth
            />

            <div>
              <StyledEditorModeToggle>
                <StyledEditorLabel>
                  <Trans>Message</Trans>
                </StyledEditorLabel>
                <StyledModeButton
                  type="button"
                  isActive={editorMode === 'rich'}
                  onClick={() => handleEditorModeChange('rich')}
                >
                  <IconTextSize size={theme.icon.size.sm} />
                  <Trans>Rich Editor</Trans>
                </StyledModeButton>
                <StyledModeButton
                  type="button"
                  isActive={editorMode === 'html'}
                  onClick={() => handleEditorModeChange('html')}
                >
                  <IconCode size={theme.icon.size.sm} />
                  <Trans>Raw HTML</Trans>
                </StyledModeButton>
              </StyledEditorModeToggle>

              {editorMode === 'rich' ? (
                <StyledEditorContainer>
                  <BlockEditor editor={editor} />
                </StyledEditorContainer>
              ) : (
                <StyledHtmlTextArea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder={t`<p>Enter your HTML content here...</p>`}
                />
              )}
              {showSignaturePreview &&
                includeSignature &&
                sanitizedSignature !== '' && (
                  <StyledSignaturePreview>
                    <StyledSignatureLabel>
                      <Trans>Signature Preview</Trans>
                    </StyledSignatureLabel>
                    <StyledSignatureContent>
                      <div>--</div>
                      {/* Signature HTML is sanitized with DOMPurify above */}
                      <div
                        dangerouslySetInnerHTML={{ __html: sanitizedSignature }}
                      />
                    </StyledSignatureContent>
                  </StyledSignaturePreview>
                )}

              {/* Message history for replies */}
              {threadId && sanitizedQuotedMessage !== '' && (
                <StyledMessageHistory>
                  <StyledMessageHistoryHeader
                    type="button"
                    onClick={() => setShowMessageHistory(!showMessageHistory)}
                  >
                    {showMessageHistory ? (
                      <IconChevronUp size={theme.icon.size.sm} />
                    ) : (
                      <IconChevronDown size={theme.icon.size.sm} />
                    )}
                    <Trans>Previous Message</Trans>
                  </StyledMessageHistoryHeader>
                  {showMessageHistory && (
                    <StyledMessageHistoryContent>
                      {/* Quoted message is sanitized with DOMPurify above */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizedQuotedMessage,
                        }}
                      />
                    </StyledMessageHistoryContent>
                  )}
                </StyledMessageHistory>
              )}
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
