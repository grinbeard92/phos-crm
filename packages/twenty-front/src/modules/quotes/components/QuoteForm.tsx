import styled from '@emotion/styled';
import { useState } from 'react';
import { IconCheck, IconX } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { H2Title } from 'twenty-ui/typography';
import { useQuoteForm } from '../hooks/useQuoteForm';
import { useCreateQuote } from '../hooks/useCreateQuote';
import {
  useCompanyOptions,
  useContactOptions,
  useProjectOptions,
} from '../hooks/useRelationOptions';
import { QuoteLineItemEditor } from './QuoteLineItemEditor';
import { QuoteTotalsSection } from './QuoteTotalsSection';

type QuoteFormProps = {
  onCancel?: () => void;
  onSuccess?: (quoteId: string) => void;
  initialCompanyId?: string;
  initialContactId?: string;
  initialProjectId?: string;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
  padding: ${({ theme }) => theme.spacing(6)};
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledSectionTitle = styled(H2Title)`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledFieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledFieldColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledRequiredMark = styled.span`
  color: ${({ theme }) => theme.color.red};
  margin-left: ${({ theme }) => theme.spacing(0.5)};
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid
    ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.color.blue};
  }
`;

const StyledSelect = styled.select<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid
    ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.color.blue};
  }
`;

const StyledTextArea = styled.textarea<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid
    ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  font-family: inherit;
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.color.red : theme.color.blue};
  }
`;

const StyledErrorText = styled.div`
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing(4)};
  border-top: 1px solid ${({ theme }) => theme.border.color.medium};
`;

const StyledGlobalError = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.background.danger};
  border: 1px solid ${({ theme }) => theme.color.red};
  border-radius: ${({ theme }) => theme.border.radius.md};
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

export const QuoteForm = ({
  onCancel,
  onSuccess,
  initialCompanyId,
  initialContactId,
  initialProjectId,
}: QuoteFormProps) => {
  const {
    formData,
    calculations,
    errors,
    isSaving,
    setIsSaving,
    updateField,
    addLineItem,
    updateLineItem,
    removeLineItem,
    validate,
  } = useQuoteForm();

  const { createQuote } = useCreateQuote();
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch relation options
  const { options: companyOptions, loading: companiesLoading } =
    useCompanyOptions(formData.companyId);
  const { options: contactOptions, loading: contactsLoading } =
    useContactOptions(formData.companyId);
  const { options: projectOptions, loading: projectsLoading } =
    useProjectOptions(formData.companyId);

  const handleSubmit = async () => {
    setGlobalError(null);

    if (!validate()) {
      setGlobalError('Please fix the errors above before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const quoteId = await createQuote(formData);
      onSuccess?.(quoteId);
    } catch (error) {
      console.error('Failed to create quote:', error);
      setGlobalError(
        error instanceof Error
          ? error.message
          : 'Failed to create quote. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledContainer>
      <StyledSection>
        <StyledSectionTitle title="Quote Details" />

        <StyledFieldGrid>
          <StyledFieldColumn>
            <StyledField>
              <StyledLabel>
                Company<StyledRequiredMark>*</StyledRequiredMark>
              </StyledLabel>
              <StyledSelect
                value={formData.companyId || ''}
                onChange={(e) => updateField('companyId', e.target.value || null)}
                hasError={!!errors.companyId}
                disabled={companiesLoading}
              >
                <option value="">
                  {companiesLoading ? 'Loading companies...' : 'Select a company...'}
                </option>
                {companyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </StyledSelect>
              {errors.companyId && (
                <StyledErrorText>{errors.companyId}</StyledErrorText>
              )}
            </StyledField>

            <StyledField>
              <StyledLabel>Contact</StyledLabel>
              <StyledSelect
                value={formData.contactId || ''}
                onChange={(e) => updateField('contactId', e.target.value || null)}
                disabled={!formData.companyId || contactsLoading}
              >
                <option value="">
                  {!formData.companyId
                    ? 'Select company first...'
                    : contactsLoading
                      ? 'Loading contacts...'
                      : 'Select a contact...'}
                </option>
                {contactOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </StyledSelect>
            </StyledField>

            <StyledField>
              <StyledLabel>Project</StyledLabel>
              <StyledSelect
                value={formData.projectId || ''}
                onChange={(e) => updateField('projectId', e.target.value || null)}
                disabled={projectsLoading}
              >
                <option value="">
                  {projectsLoading ? 'Loading projects...' : 'Select a project...'}
                </option>
                {projectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </StyledSelect>
            </StyledField>
          </StyledFieldColumn>

          <StyledFieldColumn>
            <StyledField>
              <StyledLabel>
                Quote Date<StyledRequiredMark>*</StyledRequiredMark>
              </StyledLabel>
              <StyledInput
                type="date"
                value={formData.quoteDate}
                onChange={(e) => updateField('quoteDate', e.target.value)}
                hasError={!!errors.quoteDate}
              />
              {errors.quoteDate && (
                <StyledErrorText>{errors.quoteDate}</StyledErrorText>
              )}
            </StyledField>

            <StyledField>
              <StyledLabel>Expiration Date</StyledLabel>
              <StyledInput
                type="date"
                value={formData.expirationDate || ''}
                onChange={(e) =>
                  updateField('expirationDate', e.target.value || null)
                }
              />
            </StyledField>

            <StyledField>
              <StyledLabel>Status</StyledLabel>
              <StyledSelect
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value as any)}
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="VIEWED">Viewed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="DECLINED">Declined</option>
                <option value="EXPIRED">Expired</option>
              </StyledSelect>
            </StyledField>
          </StyledFieldColumn>
        </StyledFieldGrid>
      </StyledSection>

      <StyledSection>
        <StyledSectionTitle title="Line Items" />
        <QuoteLineItemEditor
          lineItems={formData.lineItems}
          onUpdate={updateLineItem}
          onAdd={addLineItem}
          onRemove={removeLineItem}
          errors={errors}
        />
        {errors.lineItems && (
          <StyledErrorText>{errors.lineItems}</StyledErrorText>
        )}
      </StyledSection>

      <StyledSection>
        <QuoteTotalsSection
          calculations={calculations}
          discountPercentage={formData.discountPercentage}
          taxPercentage={formData.taxPercentage}
          onDiscountChange={(value) => updateField('discountPercentage', value)}
          onTaxChange={(value) => updateField('taxPercentage', value)}
        />
      </StyledSection>

      <StyledSection>
        <StyledSectionTitle title="Additional Information" />
        <StyledFieldGrid>
          <StyledField>
            <StyledLabel>Notes</StyledLabel>
            <StyledTextArea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value || null)}
              placeholder="Internal notes (not visible to customer)"
            />
          </StyledField>

          <StyledField>
            <StyledLabel>Terms & Conditions</StyledLabel>
            <StyledTextArea
              value={formData.terms || ''}
              onChange={(e) => updateField('terms', e.target.value || null)}
              placeholder="Payment terms, conditions, etc."
            />
          </StyledField>
        </StyledFieldGrid>
      </StyledSection>

      {globalError && <StyledGlobalError>{globalError}</StyledGlobalError>}

      <StyledActions>
        {onCancel && (
          <Button
            Icon={IconX}
            title="Cancel"
            onClick={onCancel}
            variant="secondary"
            disabled={isSaving}
          />
        )}
        <Button
          Icon={IconCheck}
          title={isSaving ? 'Saving...' : 'Save Quote'}
          onClick={handleSubmit}
          disabled={isSaving}
        />
      </StyledActions>
    </StyledContainer>
  );
};
