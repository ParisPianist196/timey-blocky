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
      originalStart: number;
      originalEnd: number;
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
 * Normalize a range regardless of drag direction.
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
 * Calculate the live range represented by an interaction.
 *
 * This is intentionally separate from persistence/state updates.
 * The UI can use this during pointer movement so that dragging
 * remains visually immediate.
 */
export function getInteractionRange(
  interaction: InteractionState,
  blocks: TimeBlock[],
  dayStart: number,
  dayEnd: number,
  snapInterval = 15,
): DragSelection | null {
  if (interaction.type === "creating") {
    return getCreationRange(
      interaction.startMinutes,
      interaction.currentMinutes,
      snapInterval,
    );
  }

  if (interaction.type === "moving") {
    const block = blocks.find(
      (candidate) => candidate.id === interaction.blockId,
    );

    if (!block) {
      return null;
    }

    return getMovedBlockRange(
      {
        ...block,
        start: interaction.originalStart,
        end: interaction.originalEnd,
      },
      interaction.currentMinutes,
      interaction.offsetMinutes,
      dayStart,
      dayEnd,
      snapInterval,
    );
  }

  if (interaction.type === "resizing-start") {
    return {
      start: getResizedStart(
        interaction.originalEnd,
        interaction.currentMinutes,
        dayStart,
        snapInterval,
      ),
      end: interaction.originalEnd,
    };
  }

  if (interaction.type === "resizing-end") {
    return {
      start: interaction.originalStart,
      end: getResizedEnd(
        interaction.originalStart,
        interaction.currentMinutes,
        dayEnd,
        snapInterval,
      ),
    };
  }

  return null;
}

/**
 * Calculate the distance between two pointers.
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
