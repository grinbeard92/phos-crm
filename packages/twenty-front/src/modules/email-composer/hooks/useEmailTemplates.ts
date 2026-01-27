import { useCallback, useEffect, useMemo } from 'react';

import { useRecoilState, useRecoilValue } from 'recoil';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { type EmailTemplateOption } from '@/email-composer/types/EmailComposerTypes';
import {
  DEFAULT_EMAIL_TEMPLATES,
  type LocalEmailTemplate,
  localEmailTemplatesState,
} from '@/email-composer/states/emailComposerSettingsState';

/**
 * Hook for managing email templates.
 * Uses local storage for now - can be migrated to a custom object later.
 */
export const useEmailTemplates = () => {
  const currentWorkspace = useRecoilValue(currentWorkspaceState);
  const workspaceId = currentWorkspace?.id ?? 'default';

  const [localTemplates, setLocalTemplates] = useRecoilState(
    localEmailTemplatesState(workspaceId),
  );

  // Initialize with default templates if empty
  // This runs on mount and whenever localTemplates becomes empty
  useEffect(() => {
    // Only initialize if we have a valid workspace and templates are empty
    if (localTemplates.length === 0 && workspaceId !== '') {
      const now = new Date().toISOString();
      const defaultTemplates: LocalEmailTemplate[] =
        DEFAULT_EMAIL_TEMPLATES.map((tmpl, index) => ({
          ...tmpl,
          id: `default-${index + 1}`,
          createdAt: now,
          updatedAt: now,
        }));
      setLocalTemplates(defaultTemplates);
    }
  }, [localTemplates.length, setLocalTemplates, workspaceId]);

  // Filter to active templates only
  const templates: EmailTemplateOption[] = useMemo(
    () =>
      localTemplates
        .filter((tmpl) => tmpl.isActive)
        .map((tmpl) => ({
          id: tmpl.id,
          name: tmpl.name,
          subject: tmpl.subject,
          body: tmpl.body,
          category: tmpl.category,
          variables: extractVariables(tmpl.subject + tmpl.body),
        })),
    [localTemplates],
  );

  const createTemplate = useCallback(
    (
      template: Omit<LocalEmailTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    ): LocalEmailTemplate => {
      const now = new Date().toISOString();
      const newTemplate: LocalEmailTemplate = {
        ...template,
        id: `tmpl-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setLocalTemplates((prev) => [...prev, newTemplate]);

      return newTemplate;
    },
    [setLocalTemplates],
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<LocalEmailTemplate>) => {
      setLocalTemplates((prev) =>
        prev.map((tmpl) =>
          tmpl.id === id
            ? { ...tmpl, ...updates, updatedAt: new Date().toISOString() }
            : tmpl,
        ),
      );
    },
    [setLocalTemplates],
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      setLocalTemplates((prev) => prev.filter((tmpl) => tmpl.id !== id));
    },
    [setLocalTemplates],
  );

  const getAllTemplates = useCallback(() => localTemplates, [localTemplates]);

  return {
    templates,
    allTemplates: localTemplates,
    loading: false,
    error: undefined,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getAllTemplates,
  };
};

/**
 * Extract variable patterns from content.
 */
const extractVariables = (content: string): string[] => {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variablePattern.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
};
