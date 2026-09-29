/**
 * Safe, cross-platform haptic feedback utilities.
 * Triggers native vibration patterns when supported (Android/Chrome/Webkit mobile).
 */
export type HapticType = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning';

export function triggerHaptic(type: HapticType = 'selection'): void {
  if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'selection':
        navigator.vibrate(6);
        break;
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(35);
        break;
      case 'success':
        navigator.vibrate([10, 30, 15]);
        break;
      case 'warning':
        navigator.vibrate([25, 40, 25]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Ignore environments where vibration is blocked
  }
}
