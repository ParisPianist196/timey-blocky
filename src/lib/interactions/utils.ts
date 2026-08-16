import type { DragSelection } from "@lib/timeline/types";

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

/**
 * Resize the beginning of a block.
 */
export function getResizedStart(
  originalEnd: number,
  currentMinutes: number,
  dayStart: number,
  snapInterval = 15,
  minimumDuration = 15,
): number {
  const snapped = snapMinutes(currentMinutes, snapInterval);

  return clampMinutes(snapped, dayStart, originalEnd - minimumDuration);
}

/**
 * Resize the end of a block.
 */
export function getResizedEnd(
  originalStart: number,
  currentMinutes: number,
  dayEnd: number,
  snapInterval = 15,
  minimumDuration = 15,
): number {
  const snapped = snapMinutes(currentMinutes, snapInterval);

  return clampMinutes(snapped, originalStart + minimumDuration, dayEnd);
}
