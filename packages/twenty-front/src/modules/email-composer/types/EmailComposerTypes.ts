export type EmailRecipient = {
  email: string;
  name?: string;
};

export type EmailAttachment = {
  id: string;
  name: string;
  url: string;
  size?: number;
};

export type EmailComposeData = {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  templateId?: string;
  threadId?: string;
  inReplyTo?: string;
};

export type EmailTemplateOption = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
};

export type EmailComposeContext = {
  personId?: string;
  personFirstName?: string;
  personLastName?: string;
  personEmail?: string;
  companyId?: string;
  companyName?: string;
};
