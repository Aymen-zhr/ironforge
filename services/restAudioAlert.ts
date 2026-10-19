import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * REST TIMER AUDIO & HAPTIC ALERT
 * Synthesizes an immediate audio tone using Web Audio API on web/browsers,
 * and triggers dual tactile haptics. Zero network dependencies, 100% offline.
 */

export function playRestTimerCompletedAlert(): void {
  // 1. Trigger robust dual-pulse haptic vibration
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } catch {}
    }, 200);
  } catch {}

  // 2. Play zero-latency synthetic audio chime on web / DOM environments
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Double ascending chime: 880Hz (A5) then 1174Hz (D6)
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('[restAudioAlert] Web Audio notice:', e);
    }
  }
}
