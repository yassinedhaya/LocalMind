/**
 * Stitch-inspired design tokens for LocalMind.
 *
 * Stitch's visual language: a single warm, confident accent, generous
 * rounding, soft layered elevation, and a calm dark canvas with high
 * legibility. These tokens are the single source of truth for the app's
 * surface, accent, and text colors.
 */

export const StitchColors = {
  // Warm coral accent (Stitch signature)
  accent: '#FF6B5E',
  accentSoft: '#FF8A7E',
  accentDeep: '#E25247',
  accentTint: 'rgba(255, 107, 94, 0.14)',
  onAccent: '#1A0E0C',

  // Surfaces (dark, calm)
  bg: '#0E0E14',
  surface: '#17171F',
  surfaceAlt: '#1F1F2A',
  surfaceRaised: '#23232F',

  // Borders
  border: '#2A2A38',
  borderStrong: '#3A3A4D',

  // Text
  text: '#FFFFFF',
  textSecondary: '#B7B7C7',
  textMuted: '#7A7A8E',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
} as const;

export const StitchRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const StitchShadow = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  } as const,
  lift: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
  } as const,
} as const;

export const StitchType = {
  display: 32,
  title: 22,
  heading: 18,
  body: 15,
  caption: 13,
} as const;
