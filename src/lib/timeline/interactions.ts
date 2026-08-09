import type { TimeBlock } from "./types";

export type InteractionState =
  | { type: "idle" }
  | {
      type: "creating";
      startMinutes: number;
      currentMinutes: number;
    }
  | {
      type: "moving";
      blockId: string;
      startMinutes: number;
      currentMinutes: number;
      offsetMinutes: number;
    }
  | {
      type: "resizing-start";
      blockId: string;
      originalStart: number;
      originalEnd: number;
      currentMinutes: number;
    }
  | {
      type: "resizing-end";
      blockId: string;
      originalStart: number;
      originalEnd: number;
      currentMinutes: number;
    }
  | {
      type: "zooming";
      startDistance: number;
      startPixelsPerHour: number;
    };

export type PointerPosition = {
  x: number;
  y: number;
};

export type DragSelection = {
  start: number;
  end: number;
};

/**
 * Convert a vertical pixel position into minutes.
 *
 * `dayStart` is the first visible minute of the timeline.
 * `pixelsPerHour` controls the visual zoom level.
 */
export function pixelsToMinutes(
  pixels: number,
  dayStart: number,
  pixelsPerHour: number,
): number {
  return dayStart + (pixels / pixelsPerHour) * 60;
}

/**
 * Convert minutes into a vertical pixel position.
 */
export function minutesToPixels(
  minutes: number,
  dayStart: number,
  pixelsPerHour: number,
): number {
  return ((minutes - dayStart) / 60) * pixelsPerHour;
}

/**
 * Snap a time to the nearest interval.
 *
 * Example:
 *   snapMinutes(527, 15) → 525
 *   snapMinutes(533, 15) → 540
 */
export function snapMinutes(minutes: number, interval = 15): number {
  return Math.round(minutes / interval) * interval;
}

/**
 * Clamp a time to the timeline's boundaries.
 */
export function clampMinutes(
  minutes: number,
  dayStart: number,
  dayEnd: number,
): number {
  return Math.max(dayStart, Math.min(minutes, dayEnd));
}

/**
 * Get the normalized range regardless of drag direction.
 *
 * Dragging from 10:00 → 11:00:
 *   { start: 600, end: 660 }
 *
 * Dragging from 11:00 → 10:00:
 *   { start: 600, end: 660 }
 */
export function normalizeRange(start: number, end: number): DragSelection {
  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
}

/**
 * Calculate the range being created during a drag.
 */
export function getCreationRange(
  startMinutes: number,
  currentMinutes: number,
  snapInterval = 15,
): DragSelection {
  const start = snapMinutes(startMinutes, snapInterval);
  const end = snapMinutes(currentMinutes, snapInterval);

  return normalizeRange(start, end);
}

/**
 * Calculate the new position of a block while dragging.
 */
export function getMovedBlockRange(
  block: TimeBlock,
  currentMinutes: number,
  offsetMinutes: number,
  dayStart: number,
  dayEnd: number,
  snapInterval = 15,
): DragSelection {
  const duration = block.end - block.start;

  let start = snapMinutes(currentMinutes - offsetMinutes, snapInterval);

  start = clampMinutes(start, dayStart, dayEnd - duration);

  return {
    start,
    end: start + duration,
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

/**
 * Calculate the distance between two pointers.
 *
 * Used for pinch-to-zoom.
 */
export function pointerDistance(
  first: PointerPosition,
  second: PointerPosition,
): number {
  const dx = first.x - second.x;
  const dy = first.y - second.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate a new zoom level from a pinch gesture.
 */
export function getPinchZoom(
  startDistance: number,
  currentDistance: number,
  startPixelsPerHour: number,
  minPixelsPerHour: number,
  maxPixelsPerHour: number,
): number {
  if (startDistance === 0) {
    return startPixelsPerHour;
  }

  const scale = currentDistance / startDistance;

  return clamp(startPixelsPerHour * scale, minPixelsPerHour, maxPixelsPerHour);
}

/**
 * Clamp a numeric value between two bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
