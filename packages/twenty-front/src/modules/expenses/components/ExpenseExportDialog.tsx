import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from 'twenty-ui/input';
import { H2Title } from 'twenty-ui/display';
import { useExportExpenses } from '../hooks/useExportExpenses';

type ExpenseExportDialogProps = {
  expenses: any[];
  onClose: () => void;
};

const StyledOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const StyledDialog = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(6)};
  max-width: 500px;
  width: 90%;
  box-shadow: ${({ theme }) => theme.boxShadow.strong};
`;

const StyledFormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  margin: ${({ theme }) => theme.spacing(4)} 0;
`;

const StyledFormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledLabel = styled.label`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledInput = styled.input`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
  }
`;

const StyledCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const StyledButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

const StyledQuickButton = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

export const ExpenseExportDialog = ({
  expenses,
  onClose,
}: ExpenseExportDialogProps) => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [taxDeductibleOnly, setTaxDeductibleOnly] = useState(true);

  const { exportExpenses, exportTaxYear, loading } = useExportExpenses();

  const handleExport = async () => {
    await exportExpenses(expenses, 'csv', {
      startDate,
      endDate,
      taxDeductibleOnly,
    });
    onClose();
  };

  const handleQuickExport = async (year: number) => {
    await exportTaxYear(expenses, year);
    onClose();
  };

  return (
    <StyledOverlay onClick={onClose}>
      <StyledDialog onClick={(e) => e.stopPropagation()}>
        <H2Title title="Export Expenses" />

        <StyledFormGrid>
          <StyledFormField>
            <StyledLabel>Start Date</StyledLabel>
            <StyledInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </StyledFormField>

          <StyledFormField>
            <StyledLabel>End Date</StyledLabel>
            <StyledInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </StyledFormField>

          <StyledFormField>
            <StyledCheckboxContainer>
              <StyledCheckbox
                type="checkbox"
                checked={taxDeductibleOnly}
                onChange={(e) => setTaxDeductibleOnly(e.target.checked)}
              />
              <StyledLabel>Tax Deductible Only</StyledLabel>
            </StyledCheckboxContainer>
          </StyledFormField>

          <StyledFormField>
            <StyledLabel>Quick Export</StyledLabel>
            <StyledQuickButton
              title={`Export Tax Year ${currentYear - 1}`}
              onClick={() => handleQuickExport(currentYear - 1)}
              variant="secondary"
              size="small"
              disabled={loading}
            />
            <StyledQuickButton
              title={`Export Tax Year ${currentYear}`}
              onClick={() => handleQuickExport(currentYear)}
              variant="secondary"
              size="small"
              disabled={loading}
            />
          </StyledFormField>
        </StyledFormGrid>

        <StyledButtonGroup>
          <Button
            title="Cancel"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
          />
          <Button
            title="Export CSV"
            onClick={handleExport}
            variant="primary"
            disabled={loading}
          />
        </StyledButtonGroup>
      </StyledDialog>
    </StyledOverlay>
  );
};
