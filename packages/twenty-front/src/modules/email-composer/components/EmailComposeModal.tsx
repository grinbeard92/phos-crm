import { type ConnectedAccount } from '@/accounts/types/ConnectedAccount';
import { useUploadAttachmentFile } from '@/activities/files/hooks/useUploadAttachmentFile';
import { WorkflowSendEmailAttachments } from '@/advanced-text-editor/components/WorkflowSendEmailAttachments';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { EmailTemplateSelector } from '@/email-composer/components/EmailTemplateSelector';
import { useSendEmail } from '@/email-composer/hooks/useSendEmail';
import { type EmailComposeContext, type EmailTemplateOption } from '@/email-composer/types/EmailComposerTypes';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { FormAdvancedTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormAdvancedTextFieldInput';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Select } from '@/ui/input/components/Select';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { Modal } from '@/ui/layout/modal/components/Modal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { t } from '@lingui/core/macro';
import { useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/input';
import { H2Title, IconMail, IconSend, IconX } from 'twenty-ui/display';
import { type SelectOption } from 'twenty-ui/input';

const EMAIL_EDITOR_MIN_HEIGHT = 280;
const EMAIL_EDITOR_MAX_WIDTH = 560;

export const EMAIL_COMPOSE_MODAL_ID = 'email-compose-modal';

const StyledModalHeader = styled(Modal.Header)`
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
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
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);

  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState(defaultTo || context?.personEmail || '');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [attachments, setAttachments] = useState<EmailAttachmentFile[]>([]);
  const [isSending, setIsSending] = useState(false);

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
      setBody(resolvedBody);
    },
    [context],
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

  const handleClose = useCallback(() => {
    onClose?.();
    closeModal(EMAIL_COMPOSE_MODAL_ID);
  }, [onClose, closeModal]);

  const handleImageUpload = async (file: File) => {
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
      return undefined;
    }
  };

  const handleImageUploadError = (_: Error, file: File) => {
    enqueueErrorSnackBar({
      message: t`Failed to upload image: `.concat(file.name),
    });
  };

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
      const result = await sendEmail({
        email: toEmail,
        subject,
        body,
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
          message: t`Failed to send email: `.concat(result.error || 'Unknown error'),
        });
      }
    } catch (error) {
      enqueueErrorSnackBar({
        message: t`Failed to send email: `.concat(
          error instanceof Error ? error.message : 'Unknown error',
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

            <FormTextFieldInput
              label={t`Subject`}
              placeholder={t`Enter email subject`}
              defaultValue={subject}
              onChange={setSubject}
            />

            <FormAdvancedTextFieldInput
              label={t`Message`}
              placeholder={t`Write your message...`}
              defaultValue={body}
              onChange={setBody}
              onImageUpload={handleImageUpload}
              onImageUploadError={handleImageUploadError}
              minHeight={EMAIL_EDITOR_MIN_HEIGHT}
              maxWidth={EMAIL_EDITOR_MAX_WIDTH}
            />

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
