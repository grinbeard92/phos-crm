import styled from '@emotion/styled';
import { useRecoilState } from 'recoil';

import { persistedBackgroundToneState } from '@/ui/theme/states/persistedBackgroundToneState';
import { type BackgroundTone, DEFAULT_BACKGROUND_TONE } from 'twenty-ui/theme';

const TONE_OPTIONS: { value: BackgroundTone; label: string }[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
];

const StyledContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledToneButton = styled.button<{ isSelected: boolean }>`
  padding: ${({ theme }) => theme.spacing(1)}
    ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  border: 1px solid
    ${({ isSelected, theme }) =>
      isSelected ? theme.font.color.primary : theme.border.color.medium};
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.background.transparent.light : 'transparent'};
  color: ${({ isSelected, theme }) =>
    isSelected ? theme.font.color.primary : theme.font.color.secondary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-family: ${({ theme }) => theme.font.family};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.font.color.tertiary};
  }
`;

export const BackgroundToneSelector = () => {
  const [backgroundTone, setBackgroundTone] = useRecoilState(
    persistedBackgroundToneState,
  );
  const selectedTone = backgroundTone ?? DEFAULT_BACKGROUND_TONE;

  return (
    <StyledContainer>
      {TONE_OPTIONS.map((option) => (
        <StyledToneButton
          key={option.value}
          isSelected={option.value === selectedTone}
          onClick={() => setBackgroundTone(option.value)}
        >
          {option.label}
        </StyledToneButton>
      ))}
    </StyledContainer>
  );
};
