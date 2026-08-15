import type { TimeBlock, TimelineConfig } from "../timeline/types";
import { updateBlock } from "./timelineBlocks.svelte";

export const defaultConfig = {
  dayStart: 600,
  dayEnd: 1440,
  snapMinutes: 15,
  pixelsPerHour: 80,
};

export class TimelineInteractions {
  boundingRect: DOMRect;
  config = $state<TimelineConfig>(defaultConfig);

  constructor(config: TimelineConfig, boundingRect: DOMRect) {
    this.config = config;
    this.boundingRect = boundingRect;
  }

  pointerToMinutes(pEvent: PointerEvent): number {
    if (!this.boundingRect || !this.config)
      throw Error("State not initialized");

    const pixels = pEvent.clientY - this.boundingRect.top;

    const minutes = pixelsToMinutes(
      pixels,
      this.config.dayStart,
      this.config.pixelsPerHour,
    );

    return Math.max(
      this.config.dayStart,
      Math.min(minutes, this.config.dayEnd),
    );
  }

  getMovedBlockRange(
    block: TimeBlock,
    currentMinutes: number,
    offsetMinutes: number,
  ): DragSelection {
    const duration = block.end - block.start;

    let start = snapMinutes(
      currentMinutes - offsetMinutes,
      this.config.snapMinutes,
    );

    start = clampMinutes(
      start,
      this.config.dayStart,
      this.config.dayEnd - duration,
    );

    return {
      start,
      end: start + duration,
    };
  }
}

export class BlockInteraction {
  curInteractingElement = $state<HTMLElement | null>(null);
  curPointerInteractionId = $state<number | null>(null);
  timelineInteractions: TimelineInteractions;
  initialBlock: TimeBlock;
  localBlock: TimeBlock;

  constructor(interactions: TimelineInteractions, block: TimeBlock) {
    this.timelineInteractions = interactions;
    this.initialBlock = block;
    this.localBlock = { ...block };
  }

  reset() {}

  pointerStartAction(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    const element = event.currentTarget as HTMLButtonElement;

    this.curInteractingElement = element;

    this.curPointerInteractionId = event.pointerId;

    element.setPointerCapture(event.pointerId);
  }

  pointerMoveAction(event: PointerEvent) {
    if (
      this.curPointerInteractionId === null ||
      event.pointerId !== this.curPointerInteractionId
    ) {
      return;
    }

    return this.timelineInteractions.pointerToMinutes(event);
  }

  async pointerEndAction(event: PointerEvent) {
    if (
      this.curPointerInteractionId === null ||
      event.pointerId !== this.curPointerInteractionId
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (
      this.curInteractingElement &&
      this.curPointerInteractionId !== null &&
      this.curInteractingElement.hasPointerCapture(this.curPointerInteractionId)
    ) {
      this.curInteractingElement.releasePointerCapture(
        this.curPointerInteractionId,
      );
    }

    this.curInteractingElement = null;
    this.curPointerInteractionId = null;
    if (
      this.localBlock.start !== this.initialBlock.start ||
      this.localBlock.end !== this.initialBlock.end
    ) {
      this.initialBlock = this.localBlock;
      await updateBlock(this.initialBlock.id, {
        start: this.localBlock.start,
        end: this.localBlock.end,
      });
    }
  }
}

export class MoveBlockInteraction extends BlockInteraction {
  curOffsetMinutes: number;

  constructor(block: TimeBlock, interactions: TimelineInteractions) {
    super(interactions, block);
    this.curOffsetMinutes = 0;
  }

  override pointerStartAction(event: PointerEvent): void {
    const currentMinutes = this.timelineInteractions.pointerToMinutes(event);

    this.curOffsetMinutes = currentMinutes - this.initialBlock.start;
  }

  override pointerMoveAction(event: PointerEvent): number | undefined {
    const currentMinutes = super.pointerMoveAction(event);

    if (!currentMinutes) return;

    const range = this.timelineInteractions.getMovedBlockRange(
      {
        ...this.localBlock,
        start: this.initialBlock.start,
        end: this.initialBlock.end,
      },
      currentMinutes,
      this.curOffsetMinutes,
    );

    this.localBlock.start = range.start;
    this.localBlock.end = range.end;

    return;
  }
}

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
