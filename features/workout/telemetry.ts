/**
 * BIOMETRIC TELEMETRY ENGINE
 * Re-exports shared math utilities to maintain backwards compatibility
 */

export * from '../../utils/plateCalculator';
export * from '../../utils/strengthMath';

// Backwards-compatible alias for telemetry
import { calculate1RmTelemetry } from '../../utils/strengthMath';
export const calculateOneRepMaxTelemetry = calculate1RmTelemetry;
export type OneRepMaxEstimate = ReturnType<typeof calculate1RmTelemetry> & {
  reps?: number;
  weightKg?: number;
};
