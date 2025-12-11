/**
 * Brand Color Schema
 * All colors are defined as CSS variables in style.css
 * Use these constants for programmatic access in TypeScript
 */

export const COLORS = {
  // Primary colors
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primaryLight: 'var(--color-primary-light)',
  primaryDark: 'var(--color-primary-dark)',

  // Accent colors
  accent: 'var(--color-accent)',
  accentHover: 'var(--color-accent-hover)',
  accentLight: 'var(--color-accent-light)',
  accentDark: 'var(--color-accent-dark)',

  // Grays
  gray50: 'var(--color-gray-50)',
  gray100: 'var(--color-gray-100)',
  gray200: 'var(--color-gray-200)',
  gray300: 'var(--color-gray-300)',
  gray400: 'var(--color-gray-400)',
  gray500: 'var(--color-gray-500)',
  gray600: 'var(--color-gray-600)',
  gray700: 'var(--color-gray-700)',
  gray800: 'var(--color-gray-800)',
  gray900: 'var(--color-gray-900)',

  // Semantic colors
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
} as const;

/**
 * Annotation color palette - using brand colors
 * These are the colors users can select for annotations
 * Note: For CSS variable colors, we need to use the actual hex values since
 * CSS variables can't be used directly in style.backgroundColor
 */
export const ANNOTATION_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan (accent) - matches var(--color-accent)
  '#6366f1', // Indigo (primary) - matches var(--color-primary)
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#000000', // Black
  '#64748b', // Medium gray - matches var(--color-gray-500)
  '#1e293b', // Dark gray - matches var(--color-gray-800)
] as const;
