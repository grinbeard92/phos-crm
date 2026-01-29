import { GRAY_SCALE_DARK } from './GrayScaleDark';
import { GRAY_SCALE_LIGHT } from './GrayScaleLight';

export type BackgroundTone = 'neutral' | 'warm' | 'cool';

export const DEFAULT_BACKGROUND_TONE: BackgroundTone = 'neutral';

type GrayScaleValues = typeof GRAY_SCALE_LIGHT;

/**
 * Shifts a display-p3 color string's RGB channels by the given deltas.
 * Input format: "color(display-p3 R G B)" where R, G, B are 0-1 floats.
 * Deltas are clamped so output values stay within [0, 1].
 */
const shiftP3Color = (
  colorStr: string,
  rDelta: number,
  gDelta: number,
  bDelta: number,
): string => {
  const match = colorStr.match(
    /color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/,
  );

  if (!match) {
    return colorStr;
  }

  const clamp = (v: number): number => Math.min(1, Math.max(0, v));

  const r = clamp(parseFloat(match[1]) + rDelta);
  const g = clamp(parseFloat(match[2]) + gDelta);
  const b = clamp(parseFloat(match[3]) + bDelta);

  return `color(display-p3 ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`;
};

const buildShiftedGrayScale = (
  base: GrayScaleValues,
  rDelta: number,
  gDelta: number,
  bDelta: number,
): GrayScaleValues => ({
  gray1: shiftP3Color(base.gray1, rDelta, gDelta, bDelta),
  gray2: shiftP3Color(base.gray2, rDelta, gDelta, bDelta),
  gray3: shiftP3Color(base.gray3, rDelta, gDelta, bDelta),
  gray4: shiftP3Color(base.gray4, rDelta, gDelta, bDelta),
  gray5: shiftP3Color(base.gray5, rDelta, gDelta, bDelta),
  gray6: shiftP3Color(base.gray6, rDelta, gDelta, bDelta),
  gray7: shiftP3Color(base.gray7, rDelta, gDelta, bDelta),
  gray8: shiftP3Color(base.gray8, rDelta, gDelta, bDelta),
  gray9: shiftP3Color(base.gray9, rDelta, gDelta, bDelta),
  gray10: shiftP3Color(base.gray10, rDelta, gDelta, bDelta),
  gray11: shiftP3Color(base.gray11, rDelta, gDelta, bDelta),
  gray12: shiftP3Color(base.gray12, rDelta, gDelta, bDelta),
});

export const BACKGROUND_TONE_GRAY_SCALES: Record<
  BackgroundTone,
  {
    light: GrayScaleValues;
    dark: GrayScaleValues;
  }
> = {
  neutral: {
    light: GRAY_SCALE_LIGHT,
    dark: GRAY_SCALE_DARK,
  },
  warm: {
    light: buildShiftedGrayScale(GRAY_SCALE_LIGHT, 0.01, 0.005, -0.01),
    dark: buildShiftedGrayScale(GRAY_SCALE_DARK, 0.01, 0.005, -0.01),
  },
  cool: {
    light: buildShiftedGrayScale(GRAY_SCALE_LIGHT, -0.01, 0, 0.01),
    dark: buildShiftedGrayScale(GRAY_SCALE_DARK, -0.01, 0, 0.01),
  },
};
