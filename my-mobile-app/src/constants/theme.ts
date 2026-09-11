/**
 * XactScore brand tokens mirrored from the web app globals.css.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#e2e8f0',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e0e7ff',
    textSecondary: '#64748b',
    accent: '#4f46e5',
    accentMuted: '#c7d2fe',
    danger: '#dc2626',
    success: '#059669',
  },
  dark: {
    text: '#f7f7f8',
    background: '#18181b',
    backgroundElement: '#18181b',
    backgroundSelected: '#27272a',
    textSecondary: '#9a9aa3',
    accent: '#ff8a2b',
    accentMuted: '#78350f',
    danger: '#f87171',
    success: '#34d399',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
