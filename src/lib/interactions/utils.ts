import type { DragSelection } from "@lib/interactions/types";

/**
 * Snap a time to the nearest interval.
 */
export function snapMinutes(minutes: number, interval = 15): number {
  return Math.round(minutes / interval) * interval;
}

/**
 * Clamp a time between two bounds.
 */
export function clampMinutes(
  minutes: number,
  min: number,
  max: number,
): number {
  return Math.max(min, Math.min(minutes, max));
}

/**
 * Normalize a range regardless of drag direction.
 */
export function normalizeRange(start: number, end: number): DragSelection {
  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
}
