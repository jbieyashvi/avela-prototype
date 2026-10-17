/** Mirror of the @theme tokens in src/index.css, for the /design-system route and Figma handoff. */

export const PRIMITIVE_COLORS = [
  { group: 'Royal', tokens: [['royal-700', '#1430C4'], ['royal-500', '#183BE2'], ['royal-400', '#5065EF'], ['royal-100', '#E6E9FD']] },
  { group: 'Periwinkle', tokens: [['peri-300', '#B7BFFB'], ['peri-200', '#D6DAFD']] },
  { group: 'Lavender', tokens: [['lavender-50', '#F1F1FA'], ['lavender-100', '#E8E8F6'], ['white', '#FFFFFF']] },
  { group: 'Ink', tokens: [['ink-900', '#191B2A'], ['ink-600', '#64697D'], ['ink-400', '#9A9EB1'], ['ink-200', '#E7E8F2']] },
  { group: 'Violet (action)', tokens: [['violet-600', '#4E36D4'], ['violet-500', '#6048E8'], ['violet-100', '#EEEBFD']] },
  { group: 'Coral (attention)', tokens: [['coral-700', '#B8392F'], ['coral-500', '#EF6B61'], ['coral-100', '#FDECEB']] },
  { group: 'Status', tokens: [['green-700', '#1B7A50'], ['green-100', '#E2F5EC'], ['amber-700', '#8A5A00'], ['amber-100', '#FCF2DD']] },
  { group: 'Accents (sparing)', tokens: [['cyan-400', '#3FD3F5'], ['magenta-400', '#EC4FD0']] },
] as const

export const SEMANTIC_COLORS = [
  ['canvas', 'lavender-50', 'App background'],
  ['surface', 'white', 'Cards, sheets, composer'],
  ['surface-muted', '#F7F7FD', 'Hover, inset fields'],
  ['text', 'ink-900', 'Primary text'],
  ['text-muted', 'ink-600', 'Secondary text'],
  ['text-subtle', 'ink-400', 'Placeholders, disabled'],
  ['border', 'ink-200', 'Dividers, outlines'],
  ['action', 'violet-500', 'Primary buttons, selection'],
  ['action-soft', 'violet-100', 'Soft buttons, selected fills'],
  ['brand', 'royal-500', 'Brand moments, nav active'],
  ['brand-deep', 'royal-700', 'Gradient top, theme colour'],
  ['attention', 'coral-500', 'Badges, mic-on, due states'],
  ['attention-text', 'coral-700', 'Coral text on light fills (AA)'],
  ['success', 'green-700', 'Taken, saved'],
  ['warning', 'amber-700', 'Snoozed, demo label'],
] as const

export const RADII = [
  ['sm', 10, 'Icon tiles, small chips'],
  ['md', 12, 'Inputs, list rows'],
  ['lg', 14, 'Choice cards'],
  ['card', 18, 'Cards'],
  ['sheet', 24, 'Bottom sheets'],
] as const

export const TYPE_SCALE = [
  ['display', '28 / 35', 500, 'Home greeting'],
  ['title', '22 / 28', 500, 'Screen headings'],
  ['headline', '15 / 20', 500, 'Card titles'],
  ['body', '14 / 20', 400, 'Default text'],
  ['callout', '13 / 18', 400, 'Supporting text, buttons'],
  ['caption', '12 / 16', 400, 'Meta, labels'],
  ['micro', '11 / 16', 400, 'Badges, nav labels'],
] as const

export const SHADOWS = [
  ['card', 'var(--shadow-card)'],
  ['float', 'var(--shadow-float)'],
  ['sheet', 'var(--shadow-sheet)'],
] as const

export const MOTION = [
  ['fade-in', '200ms', 'Content swaps'],
  ['rise', '240ms', 'New cards, step changes'],
  ['sheet', '260ms', 'Bottom sheet entrance'],
  ['hover / press', '150ms', 'Colour transitions'],
] as const
