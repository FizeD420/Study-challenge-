import { DefaultTheme } from 'react-native-paper';

// Color scheme following the design guidelines
export const colors = {
  primary: '#007AFF',      // Blue - Trust and reliability
  secondary: '#34C759',    // Green - Success and progress
  warning: '#FF9500',      // Orange - Attention and alerts
  error: '#FF3B30',        // Red - Errors and critical actions
  background: '#F2F2F7',   // Light gray - Clean background
  surface: '#FFFFFF',      // White - Cards and surfaces
  text: '#000000',         // Black - Primary text
  textSecondary: '#8E8E93', // Gray - Secondary text
  textLight: '#FFFFFF',    // White text
  border: '#E5E5EA',       // Light border
  disabled: '#C7C7CC',     // Disabled elements
  placeholder: '#C7C7CC',  // Placeholder text
  
  // Status colors
  online: '#34C759',
  offline: '#8E8E93',
  away: '#FF9500',
  busy: '#FF3B30',
  
  // Subject colors for variety
  mathematics: '#FF6B6B',
  physics: '#4ECDC4',
  chemistry: '#45B7D1',
  biology: '#96CEB4',
  computerScience: '#FFEAA7',
  english: '#DDA0DD',
  history: '#F4A261',
  geography: '#2A9D8F',
  economics: '#E76F51',
  other: '#6C5CE7',
};

// Typography following system fonts
export const typography = {
  fonts: {
    light: 'System',
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSizes: {
    tiny: 10,
    small: 12,
    body: 14,
    subheading: 16,
    title: 18,
    heading: 20,
    large: 24,
    extraLarge: 32,
  },
  lineHeights: {
    tiny: 12,
    small: 16,
    body: 20,
    subheading: 22,
    title: 24,
    heading: 28,
    large: 32,
    extraLarge: 40,
  },
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  extraLarge: 16,
  round: 50,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// React Native Paper theme configuration
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    text: colors.text,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: typography.fonts.regular,
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: typography.fonts.medium,
      fontWeight: '500',
    },
    light: {
      fontFamily: typography.fonts.light,
      fontWeight: '300',
    },
    thin: {
      fontFamily: typography.fonts.light,
      fontWeight: '100',
    },
  },
};

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    ...shadows.small,
  },
  button: {
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.body,
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: typography.fontSizes.body,
    lineHeight: typography.lineHeights.body,
    color: colors.text,
  },
  textSecondary: {
    fontSize: typography.fontSizes.small,
    lineHeight: typography.lineHeights.small,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: typography.fontSizes.heading,
    lineHeight: typography.lineHeights.heading,
    fontWeight: 'bold',
    color: colors.text,
  },
  title: {
    fontSize: typography.fontSizes.title,
    lineHeight: typography.lineHeights.title,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
};

// Subject color mapping
export const getSubjectColor = (subject) => {
  const subjectMap = {
    'Mathematics': colors.mathematics,
    'Physics': colors.physics,
    'Chemistry': colors.chemistry,
    'Biology': colors.biology,
    'Computer Science': colors.computerScience,
    'English': colors.english,
    'History': colors.history,
    'Geography': colors.geography,
    'Economics': colors.economics,
    'Business Studies': colors.economics,
    'Accounting': colors.economics,
    'Other': colors.other,
  };
  
  return subjectMap[subject] || colors.other;
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  theme,
  commonStyles,
  getSubjectColor,
};