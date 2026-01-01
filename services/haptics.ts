// Haptic Feedback Service using Navigator.vibrate API
// Provides tactile feedback for user interactions

export type HapticPattern = 'light' | 'medium' | 'success' | 'error' | 'warning' | 'selection';

// Check if vibration is supported
const isSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Vibration patterns (in milliseconds)
// For arrays: [vibrate, pause, vibrate, pause, ...]
const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,           // Quick tap - buttons, toggles
  medium: 25,          // Standard tap - navigation, actions
  success: [10, 50, 10], // Double pulse - likes, confirmations
  error: [50, 30, 50, 30, 50], // Triple pulse - errors, warnings
  warning: [30, 20, 30], // Double warning pulse
  selection: 15,       // Selection feedback
};

/**
 * Trigger haptic feedback
 * @param pattern - The haptic pattern to use
 * @returns boolean - Whether the vibration was triggered
 */
export const haptic = (pattern: HapticPattern = 'light'): boolean => {
  if (!isSupported()) {
    return false;
  }

  try {
    const vibrationPattern = patterns[pattern];
    return navigator.vibrate(vibrationPattern);
  } catch {
    return false;
  }
};

/**
 * Stop any ongoing vibration
 */
export const stopHaptic = (): void => {
  if (isSupported()) {
    navigator.vibrate(0);
  }
};

/**
 * Custom vibration pattern
 * @param pattern - Array of vibration/pause durations in ms
 */
export const customHaptic = (pattern: number[]): boolean => {
  if (!isSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};

// Convenience functions for common interactions
export const haptics = {
  tap: () => haptic('light'),
  click: () => haptic('medium'),
  success: () => haptic('success'),
  error: () => haptic('error'),
  warning: () => haptic('warning'),
  selection: () => haptic('selection'),
};

export default haptics;
