# Epic: User & Admin Theme Customization

## Overview

Add accent color and background tone customization at both workspace (admin) and user levels. Users can personalize their CRM appearance; admins set company-wide defaults. User preferences override workspace defaults, which override Twenty's built-in theme.

**Feature Flag**: `IS_THEME_CUSTOMIZATION_ENABLED`

**POC Scope**: Accent color (primary/brand color) + Background tone (neutral/warm/cool gray palette).

## Current State

- Emotion `ThemeProvider` with `ThemeLight` and `ThemeDark` constants
- 300+ Radix UI color tokens in 12-step scales (gray, blue, red, etc.)
- Accent system abstracts primary color via `theme.accent.*` tokens (currently hardcoded to Indigo)
- Background/border/text colors reference gray palette steps
- `WorkspaceMember.colorScheme` stores System/Light/Dark preference
- `useColorScheme()` hook reads preference, selects base theme, passes to ThemeProvider
- No workspace-level appearance settings exist

## Data Model

### Workspace entity (admin-level defaults)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `accentColor` | `string \| null` | `null` | Hex color (e.g., `#6C63FF`). Null = Twenty default (Indigo) |
| `backgroundTone` | `'neutral' \| 'warm' \| 'cool' \| null` | `null` | Gray palette selection. Null = neutral |

### WorkspaceMember entity (user-level overrides)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `accentColor` | `string \| null` | `null` | User's accent. Null = falls back to Workspace setting |
| `backgroundTone` | `'neutral' \| 'warm' \| 'cool' \| null` | `null` | User's background. Null = falls back to Workspace setting |

### Resolution Order

```
User setting → Workspace setting → Twenty default
```

### Migration

- Additive only — new nullable columns, no data loss
- Existing users see no change until they customize
- Compatible with production deployment (no schema breaks)

## Runtime Theme Resolution

### Current Flow

```
useColorScheme() → read WorkspaceMember.colorScheme
  → select ThemeLight or ThemeDark
  → pass to Emotion ThemeProvider
```

### Extended Flow

```
1. useColorScheme() → pick base theme (Light/Dark)
2. useResolvedThemePreferences() → resolve cascade:
   - accentColor: user ?? workspace ?? '#1961ED' (Twenty default)
   - backgroundTone: user ?? workspace ?? 'neutral'
3. buildCustomTheme(baseTheme, accentColor, backgroundTone):
   - Accent: generate 12-step Radix scale from hex → override theme.accent.*
   - Background: swap gray palette (neutral=gray, warm=sand, cool=slate)
     → override theme.background.*, theme.border.*, theme.font.color.*
4. Pass modified theme to ThemeProvider
```

### Accent Color Generation

Use `@radix-ui/colors` scale generation (or manual HSL interpolation) to produce a 12-step scale from a single hex input. Steps map to:
- Steps 1-2: Subtle backgrounds
- Steps 3-5: UI element backgrounds
- Steps 6-8: Borders
- Steps 9-10: Solid backgrounds (primary buttons, etc.)
- Steps 11-12: Text

### Background Tone Palettes

| Tone | Radix Palette | Visual Feel |
|------|--------------|-------------|
| Neutral | `gray` / `grayDark` | Current Twenty default |
| Warm | `sand` / `sandDark` | Warmer, slightly yellow-tinted grays |
| Cool | `slate` / `slateDark` | Cooler, slightly blue-tinted grays |

### Performance

- Theme object memoized via `useMemo`
- Recomputes only on preference change (rare user action)
- Zero render overhead during normal usage
- No CSS variable changes needed — Emotion handles everything

## Settings UI

### User Level: Experience Tab

**Location**: Settings → Accounts → Experience (existing tab)

Currently shows:
- Color scheme toggle (System/Light/Dark)

Add below existing controls:
- **Accent Color** — Preset palette (6-8 curated colors) + custom hex input
  - Presets: Indigo (default), Blue, Violet, Teal, Green, Orange, Rose, Slate
  - Custom: hex text input with color swatch preview
- **Background Tone** — 3-option radio group: Neutral / Warm / Cool
- **"Reset to company defaults"** link — clears user overrides

### Admin Level: Workspace Appearance

**Location**: Settings → General (new "Appearance" section)

- Same accent color picker + background tone selector
- Label: "Default appearance for new members"
- Preview swatch showing current company theme
- Only visible to workspace admins

### Shared Components

Both panels reuse the same form components:
- `AccentColorPicker` — grid of color swatches + hex input
- `BackgroundToneSelector` — 3-option radio with visual previews
- Target different entities (WorkspaceMember vs Workspace) via props

## Implementation Phases

### Phase 1: Backend Schema

**Files**:
- `WorkspaceMember` entity — add `accentColor`, `backgroundTone` columns
- `Workspace` entity — add `accentColor`, `backgroundTone` columns
- TypeORM migration — additive, nullable columns
- `workspace:sync-metadata` to update GraphQL schema

**Stories**:
1. Add theme preference columns to WorkspaceMember entity
2. Add theme default columns to Workspace entity
3. Generate and verify migration
4. Sync metadata and verify GraphQL exposes new fields

### Phase 2: Theme Engine

**Files**:
- `packages/twenty-front/src/modules/ui/theme/utils/buildCustomTheme.ts` (NEW)
- `packages/twenty-front/src/modules/ui/theme/hooks/useResolvedThemePreferences.ts` (NEW)
- `packages/twenty-front/src/modules/ui/theme/components/BaseThemeProvider.tsx` (MODIFY)
- `packages/twenty-ui/src/theme/constants/AccentPalettes.ts` (NEW) — preset accent scales
- `packages/twenty-ui/src/theme/constants/BackgroundTonePalettes.ts` (NEW) — gray variant maps

**Stories**:
1. Create `buildCustomTheme()` — accepts base theme + overrides, returns modified theme
2. Create `useResolvedThemePreferences()` — reads user/workspace prefs, resolves cascade
3. Create accent scale generator — hex → 12-step Radix-compatible scale
4. Create background tone palette maps — neutral/warm/cool gray variants
5. Integrate into `BaseThemeProvider` — use resolved prefs to build custom theme

### Phase 3: Settings UI

**Files**:
- `AccentColorPicker.tsx` (NEW) — color swatch grid + hex input
- `BackgroundToneSelector.tsx` (NEW) — 3-option radio with previews
- Experience tab component (MODIFY) — add new controls
- General settings component (MODIFY) — add Appearance section

**Stories**:
1. Build `AccentColorPicker` component
2. Build `BackgroundToneSelector` component
3. Add user-level controls to Experience tab
4. Add admin-level controls to General settings
5. Wire save/reset actions to GraphQL mutations

### Phase 4: Polish

**Stories**:
1. Live preview — instant theme update as user picks colors in settings
2. "Reset to company defaults" action
3. Feature flag gating — `IS_THEME_CUSTOMIZATION_ENABLED`
4. Verify Light + Dark mode both work with all accent/tone combinations

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accent scale generation produces poor contrast | Medium | Test all presets against WCAG AA. Provide only curated presets initially. |
| Gray palette swap breaks component styling | Low | Components use semantic tokens (`theme.background.primary`), not raw colors. Swapping the underlying palette is transparent. |
| Migration conflicts with upstream Twenty | Low | Additive-only, nullable columns. Easy to merge or rebase. |
| Feature flag complexity | Low | Single flag gates UI panels + theme resolution. Default off. |

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| Workspace entity | MODIFY | 1 |
| WorkspaceMember entity | MODIFY | 1 |
| TypeORM migration | CREATE | 1 |
| `buildCustomTheme.ts` | CREATE | 2 |
| `useResolvedThemePreferences.ts` | CREATE | 2 |
| `AccentPalettes.ts` | CREATE | 2 |
| `BackgroundTonePalettes.ts` | CREATE | 2 |
| `BaseThemeProvider.tsx` | MODIFY | 2 |
| `AccentColorPicker.tsx` | CREATE | 3 |
| `BackgroundToneSelector.tsx` | CREATE | 3 |
| Experience tab component | MODIFY | 3 |
| General settings component | MODIFY | 3 |

## Success Criteria

1. Admin can set company accent color and background tone in Settings → General
2. User can override with personal preferences in Settings → Experience
3. User sees "Reset to company defaults" option
4. Theme changes apply instantly (no page reload)
5. Light and Dark modes both respect accent/tone settings
6. Feature flag cleanly disables all customization when off
7. No visual regressions when using default settings
