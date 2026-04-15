/**
 * @module antdDarkTheme
 * @description Dark theme configuration for Ant Design 5.x in Admin portal.
 *              Provides dark mode support matching enterprise standards.
 * 
 * Usage:
 *   import { antdDarkTheme } from './antdDarkTheme';
 *   
 *   <ConfigProvider theme={isDarkMode ? antdDarkTheme : antdLightTheme}>
 *     <App />
 *   </ConfigProvider>
 */

import { theme } from 'antd';

export const antdDarkTheme = {
  token: {
    // ─── Color Tokens ──────────────────────────────────────────────────────────
    colorPrimary: '#1677ff',        // Keep blue for consistency with light theme
    colorSuccess: '#00ff88',        // Bright green (unified)
    colorWarning: '#ffaa00',        // Amber (unified)
    colorError: '#ff3366',          // Red (unified)
    colorInfo: '#00d4ff',           // Cyan (unified)
    colorTextBase: '#f0f1f5',       // Light text on dark
    colorBgBase: '#0a0e27',         // Very dark background

    // ─── Semantic Colors ───────────────────────────────────────────────────────
    colorBgContainer: '#111836',    // Card/container background
    colorBgElevated: '#1a1f3a',     // Elevated elements (modals, popovers)
    colorBgLayout: '#0a0e27',       // Page/layout background
    colorBorder: '#2a2f4a',         // Borders
    colorBgSpotlight: '1f2540',     // Spotlight/hover effect
    colorTextSecondary: '#b0b3c1',  // Secondary text
    colorTextTertiary: '#7a7d8f',   // Tertiary text

    // ─── Component Colors ──────────────────────────────────────────────────────
    controlItemBgActive: 'rgba(22, 119, 255, 0.15)',
    controlItemBgHover: 'rgba(255, 255, 255, 0.06)',

    // ─── Typography ────────────────────────────────────────────────────────────
    fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontWeightStrong: 600,

    // ─── Spacing & Layout ─────────────────────────────────────────────────────
    margin: 16,
    marginXS: 8,
    marginLG: 24,
    paddingLG: 24,
    paddingSM: 12,
    borderRadius: 6,

    // ─── Motion (Reduced via media query elsewhere) ────────────────────────────
    motionUnit: 0.1,
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ─── Algorithm (Dark) ──────────────────────────────────────────────────────
  algorithm: theme.darkAlgorithm,

  components: {
    Button: {
      controlHeight: 44,
      primaryColor: '#1677ff',
      borderRadius: 6,
    },
    Input: {
      controlHeight: 44,
      borderRadius: 6,
      colorBgContainer: '#1a1f3a',
    },
    Select: {
      controlHeight: 44,
      borderRadius: 6,
      colorBgContainer: '#1a1f3a',
      colorBgElevated: '#1f2540',
    },
    Table: {
      borderColor: '#2a2f4a',
      headerBg: '#111836',
      headerSortActiveBg: '#1a1f3a',
    },
    Modal: {
      borderRadiusLG: 8,
      boxShadowSecondary: '0 10px 40px rgba(0, 0, 0, 0.6)',
    },
    Drawer: {
      borderRadiusLG: 8,
      boxShadowSecondary: '0 10px 40px rgba(0, 0, 0, 0.6)',
    },
    Card: {
      borderRadiusLG: 8,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
    },
    Tooltip: {
      colorBgDefault: '#1f2540',
      colorTextLightSolid: '#f0f1f5',
      borderRadius: 6,
    },
    Menu: {
      darkItemBg: '#111836',
      darkItemSelectedBg: 'rgba(22, 119, 255, 0.15)',
    },
    Tabs: {
      colorBgContainer: 'transparent',
      colorBorderSecondary: '#2a2f4a',
    },
    Tag: {
      borderRadiusSM: 4,
      colorBgContainer: 'rgba(22, 119, 255, 0.15)',
    },
  },
};

export default antdDarkTheme;
