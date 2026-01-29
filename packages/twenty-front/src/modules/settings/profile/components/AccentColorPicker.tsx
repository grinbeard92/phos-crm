import styled from '@emotion/styled';
import { useRecoilState } from 'recoil';

import { persistedAccentPresetIdState } from '@/ui/theme/states/persistedAccentPresetIdState';
import { ACCENT_PRESETS, DEFAULT_ACCENT_PRESET_ID } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  flex-wrap: wrap;
`;

const StyledColorSwatch = styled.button<{ color: string; isSelected: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid
    ${({ isSelected, theme }) =>
      isSelected ? theme.font.color.primary : 'transparent'};
  background-color: ${({ color }) => color};
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.font.color.tertiary};
  }
`;

export const AccentColorPicker = () => {
  const [accentPresetId, setAccentPresetId] = useRecoilState(
    persistedAccentPresetIdState,
  );
  const selectedId = accentPresetId ?? DEFAULT_ACCENT_PRESET_ID;

  return (
    <StyledContainer>
      {Object.values(ACCENT_PRESETS).map((preset) => (
        <StyledColorSwatch
          key={preset.id}
          color={preset.hex}
          isSelected={preset.id === selectedId}
          onClick={() => setAccentPresetId(preset.id)}
          title={preset.label}
          aria-label={`Select ${preset.label} accent color`}
        />
      ))}
    </StyledContainer>
  );
};
