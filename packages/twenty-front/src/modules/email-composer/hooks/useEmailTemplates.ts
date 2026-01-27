import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type EmailTemplateOption } from '@/email-composer/types/EmailComposerTypes';

type EmailTemplateRecord = ObjectRecord & {
  name: string;
  subject: string;
  body: string;
  category: string;
  isActive: boolean;
  variables: string;
};

export const useEmailTemplates = () => {
  const { records, loading, error } = useFindManyRecords<EmailTemplateRecord>({
    objectNameSingular: 'emailTemplate',
    filter: {
      isActive: { eq: true },
    },
    recordGqlFields: {
      id: true,
      name: true,
      subject: true,
      body: true,
      category: true,
      isActive: true,
      variables: true,
    },
  });

  const templates: EmailTemplateOption[] = records.map((record) => ({
    id: record.id,
    name: record.name,
    subject: record.subject || '',
    body: record.body || '',
    category: record.category || 'GENERAL',
    variables: parseVariables(record.variables),
  }));

  return {
    templates,
    loading,
    error,
  };
};

const parseVariables = (variablesJson: string | null): string[] => {
  if (!variablesJson) return [];
  try {
    const parsed = JSON.parse(variablesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
