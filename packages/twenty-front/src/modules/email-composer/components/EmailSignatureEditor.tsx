import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useCreateBlockNote } from '@blocknote/react';
import DOMPurify from 'dompurify';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BLOCK_SCHEMA } from '@/activities/blocks/constants/Schema';
import { useEmailSignature } from '@/email-composer/hooks/useEmailSignature';
import { BlockEditor } from '@/ui/input/editor/components/BlockEditor';
import { H2Title } from 'twenty-ui/display';
import { Button, Toggle } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';

const StyledEditorContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  min-height: 150px;
  max-height: 300px;
  overflow: auto;

  & .editor {
    min-height: 130px !important;
    padding: ${({ theme }) => theme.spacing(2, 3)} !important;
  }

  & .bn-editor {
    padding-inline: ${({ theme }) => theme.spacing(2)} !important;
  }
`;

const StyledToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(3, 0)};
`;

const StyledToggleLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledToggleTitle = styled.span`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledToggleDescription = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(3)};
`;

const StyledPreviewContainer = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  margin-top: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(3)};
`;

const StyledPreviewLabel = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledPreviewContent = styled.div`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: 1.5;

  p {
    margin: 0 0 ${({ theme }) => theme.spacing(2)};
  }
`;

export const EmailSignatureEditor = () => {
  const {
    signature,
    includeSignature,
    showSignaturePreview,
    updateSignature,
    toggleIncludeSignature,
    toggleShowSignaturePreview,
  } = useEmailSignature();

  const [hasChanges, setHasChanges] = useState(false);

  // Parse existing signature to BlockNote format
  const getInitialContent = useCallback(() => {
    if (!signature) {
      return undefined;
    }

    // Try to parse as JSON (BlockNote format)
    try {
      return JSON.parse(signature);
    } catch {
      // Plain text or HTML - create a simple paragraph
      return [
        {
          type: 'paragraph',
          content: signature.replace(/<[^>]*>/g, ''), // Strip HTML tags
        },
      ];
    }
  }, [signature]);

  const editor = useCreateBlockNote({
    initialContent: getInitialContent(),
    domAttributes: { editor: { class: 'editor' } },
    schema: BLOCK_SCHEMA,
  });

  // Track changes
  useEffect(() => {
    const unsubscribe = editor.onEditorContentChange(() => {
      setHasChanges(true);
    });

    return unsubscribe;
  }, [editor]);

  const handleSave = useCallback(async () => {
    // Convert to HTML for storage
    const html = await editor.blocksToHTMLLossy(editor.document);
    updateSignature(html);
    setHasChanges(false);
  }, [editor, updateSignature]);

  const handleReset = useCallback(() => {
    const content = getInitialContent();
    if (content !== undefined) {
      editor.replaceBlocks(editor.document, content);
    } else {
      editor.replaceBlocks(editor.document, [
        { type: 'paragraph', content: '' },
      ]);
    }
    setHasChanges(false);
  }, [editor, getInitialContent]);

  // Sanitize signature HTML for safe preview rendering
  // The signature is user-created content stored in local storage
  const sanitizedSignature = useMemo(
    () => (signature ? DOMPurify.sanitize(signature) : ''),
    [signature],
  );

  return (
    <Section>
      <H2Title
        title={t`Email Signature`}
        description={t`Create a signature that will be automatically appended to your emails.`}
      />

      <StyledToggleRow>
        <StyledToggleLabel>
          <StyledToggleTitle>
            <Trans>Include signature</Trans>
          </StyledToggleTitle>
          <StyledToggleDescription>
            <Trans>
              Automatically include your signature when sending emails.
            </Trans>
          </StyledToggleDescription>
        </StyledToggleLabel>
        <Toggle value={includeSignature} onChange={toggleIncludeSignature} />
      </StyledToggleRow>

      <StyledToggleRow>
        <StyledToggleLabel>
          <StyledToggleTitle>
            <Trans>Preview signature in compose</Trans>
          </StyledToggleTitle>
          <StyledToggleDescription>
            <Trans>
              Show signature preview at the bottom of the email compose window.
            </Trans>
          </StyledToggleDescription>
        </StyledToggleLabel>
        <Toggle
          value={showSignaturePreview}
          onChange={toggleShowSignaturePreview}
          disabled={!includeSignature}
        />
      </StyledToggleRow>

      <StyledEditorContainer>
        <BlockEditor editor={editor} />
      </StyledEditorContainer>

      <StyledButtonRow>
        <Button
          title={t`Save Signature`}
          variant="primary"
          accent="blue"
          size="small"
          onClick={handleSave}
          disabled={!hasChanges}
        />
        <Button
          title={t`Reset`}
          variant="secondary"
          size="small"
          onClick={handleReset}
          disabled={!hasChanges}
        />
      </StyledButtonRow>

      {sanitizedSignature && includeSignature && (
        <StyledPreviewContainer>
          <StyledPreviewLabel>
            <Trans>Preview</Trans>
          </StyledPreviewLabel>
          <StyledPreviewContent>
            <div>--</div>
            {/* Signature HTML is sanitized with DOMPurify above */}
            <div dangerouslySetInnerHTML={{ __html: sanitizedSignature }} />
          </StyledPreviewContent>
        </StyledPreviewContainer>
      )}
    </Section>
  );
};
