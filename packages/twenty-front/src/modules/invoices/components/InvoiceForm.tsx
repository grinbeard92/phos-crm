import styled from '@emotion/styled';
import { useState } from 'react';
import { IconCheck, IconX, H2Title } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { useInvoiceForm } from '../hooks/useInvoiceForm';
import { useCreateInvoice } from '../hooks/useCreateInvoice';
import {
  useCompanyOptions,
  useContactOptions,
  useProjectOptions,
} from '../../quotes/hooks/useRelationOptions';
import { QuoteLineItemEditor } from '../../quotes/components/QuoteLineItemEditor';
import { InvoiceTotalsSection } from './InvoiceTotalsSection';

type InvoiceFormProps = {
  onCancel?: () => void;
  onSuccess?: (invoiceId: string) => void;
  initialCompanyId?: string;
  initialContactId?: string;
  initialProjectId?: string;
  initialQuoteId?: string;
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
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
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
  border-top: 1px solid ${({ theme }) => theme.border.color.medium};
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing(4)};
`;

const StyledGlobalError = styled.div`
  background: ${({ theme }) => theme.background.danger};
  border: 1px solid ${({ theme }) => theme.color.red};
  border-radius: ${({ theme }) => theme.border.radius.md};
  color: ${({ theme }) => theme.color.red};
  font-size: ${({ theme }) => theme.font.size.sm};
  padding: ${({ theme }) => theme.spacing(3)};
`;

export const InvoiceForm = ({
  onCancel,
  onSuccess,
  initialCompanyId,
  initialContactId,
  initialProjectId,
  initialQuoteId,
}: InvoiceFormProps) => {
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
  } = useInvoiceForm({
    companyId: initialCompanyId || null,
    contactId: initialContactId || null,
    projectId: initialProjectId || null,
    quoteId: initialQuoteId || null,
  });

  const { createInvoice } = useCreateInvoice();
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
      const invoiceId = await createInvoice(formData);
      onSuccess?.(invoiceId);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setGlobalError(
        error instanceof Error
          ? error.message
          : 'Failed to create invoice. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledContainer>
      <StyledSection>
        <StyledSectionTitle title="Invoice Details" />

        <StyledFieldGrid>
          <StyledFieldColumn>
            <StyledField>
              <StyledLabel>
                Company<StyledRequiredMark>*</StyledRequiredMark>
              </StyledLabel>
              <StyledSelect
                value={formData.companyId || ''}
                onChange={(e) =>
                  updateField('companyId', e.target.value || null)
                }
                hasError={!!errors.companyId}
                disabled={companiesLoading}
              >
                <option value="">
                  {companiesLoading
                    ? 'Loading companies...'
                    : 'Select a company...'}
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
                onChange={(e) =>
                  updateField('contactId', e.target.value || null)
                }
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
                onChange={(e) =>
                  updateField('projectId', e.target.value || null)
                }
                disabled={projectsLoading}
              >
                <option value="">
                  {projectsLoading
                    ? 'Loading projects...'
                    : 'Select a project...'}
                </option>
                {projectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </StyledSelect>
            </StyledField>

            {initialQuoteId && (
              <StyledField>
                <StyledLabel>From Quote</StyledLabel>
                <StyledInput
                  type="text"
                  value={initialQuoteId}
                  disabled
                  title="This invoice was created from a quote"
                />
              </StyledField>
            )}
          </StyledFieldColumn>

          <StyledFieldColumn>
            <StyledField>
              <StyledLabel>
                Invoice Date<StyledRequiredMark>*</StyledRequiredMark>
              </StyledLabel>
              <StyledInput
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => updateField('invoiceDate', e.target.value)}
                hasError={!!errors.invoiceDate}
              />
              {errors.invoiceDate && (
                <StyledErrorText>{errors.invoiceDate}</StyledErrorText>
              )}
            </StyledField>

            <StyledField>
              <StyledLabel>Payment Terms</StyledLabel>
              <StyledSelect
                value={formData.paymentTerms || 'Net 30'}
                onChange={(e) =>
                  updateField('paymentTerms', e.target.value || null)
                }
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
              </StyledSelect>
            </StyledField>

            <StyledField>
              <StyledLabel>Due Date</StyledLabel>
              <StyledInput
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => updateField('dueDate', e.target.value || null)}
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
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
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
        <InvoiceTotalsSection
          calculations={calculations}
          discountPercentage={formData.discountPercentage}
          taxPercentage={formData.taxPercentage}
          amountPaidMicros={formData.amountPaidMicros}
          onDiscountChange={(value) => updateField('discountPercentage', value)}
          onTaxChange={(value) => updateField('taxPercentage', value)}
          onAmountPaidChange={(valueMicros) =>
            updateField('amountPaidMicros', valueMicros)
          }
        />
      </StyledSection>

      <StyledSection>
        <StyledSectionTitle title="Additional Information" />
        <StyledField>
          <StyledLabel>Notes</StyledLabel>
          <StyledTextArea
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value || null)}
            placeholder="Internal notes"
          />
        </StyledField>
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
          title={isSaving ? 'Saving...' : 'Save Invoice'}
          onClick={handleSubmit}
          disabled={isSaving}
        />
      </StyledActions>
    </StyledContainer>
  );
};
