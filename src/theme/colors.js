/**
 * @module colors
 * @description Brand color constants.
 * 
 * Updated 2026-04-14: Aligned with unified design tokens approach.
 * - Primary: #1677ff (admin blue)
 * - Semantic: #00ff88 (success), #ffaa00 (warning), #ff3366 (danger), #00d4ff (info)
 * 
 * NOTE: Admin maintains Ant Design defaults for primary actions but adopts
 * unified semantic colors for status indicators to align with mobile/superadmin.
 */

export const colors = {
  // ─── Primary (Admin Brand) ──────────────────────────────────────────────────
  primary: '#1677ff',         // Ant Design blue (professional, clear)
  primaryLight: '#e6f7ff',
  primaryDark: '#0050b3',

  // ─── Semantic Status Colors (Unified across platforms) ────────────────────
  // Changed to align with mobile and superadmin for cross-platform consistency
  success: '#00ff88',         // bright green (unified)
  warning: '#ffaa00',         // amber (unified)
  error: '#ff3366',           // red/danger (unified)
  danger: '#ff3366',          // alias for error (unified)
  info: '#00d4ff',            // cyan (unified - replaces #1677ff)

  // ─── Light Theme Backgrounds ───────────────────────────────────────────────
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f5',      // page background
  bgTertiary: '#fafafa',

  // ─── Text (Light Theme) ────────────────────────────────────────────────────
  text: '#000000',
  textPrimary: '#111827',      // for consistency
  textSecondary: '#666666',
  textTertiary: '#9ca3af',     // muted text

  // ─── Borders ────────────────────────────────────────────────────────────────
  border: '#d9d9d9',
  borderLight: '#f0f0f0',

  // ─── Status Variants ────────────────────────────────────────────────────────
  successLight: '#e8f5e9',
  warningLight: '#fff8e1',
  dangerLight: '#ffebee',
  infoLight: '#e3f2fd',

  background: '#f5f5f5',      // legacy name (use bgSecondary)
};
  border: '#d9d9d9',
};
