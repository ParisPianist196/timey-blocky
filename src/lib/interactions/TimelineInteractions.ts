import {
  type TimelineConfig,
  type TimelineViewport,
  type TimeBlock,
  defaultConfig,
  type DragSelection,
} from "@lib/timeline/types";
import { clampMinutes, snapMinutes, normalizeRange } from "./utils";

export class TimelineInteractions {
  config = defaultConfig;
  viewport: TimelineViewport;

  constructor(config: TimelineConfig, viewport: TimelineViewport) {
    this.config = config;
    this.viewport = viewport;
  }

  pointerToMinutes(event: PointerEvent): number {
    const pixels = event.clientY - this.viewport.top + this.viewport.scrollTop;

    const minutes = this.pixelsToMinutes(pixels);

    return clampMinutes(minutes, this.config.dayStart, this.config.dayEnd);
  }

  minutesToPixels(minutes: number): number {
    return ((minutes - this.config.dayStart) / 60) * this.config.pixelsPerHour;
  }

  pixelsToMinutes(pixels: number): number {
    return this.config.dayStart + (pixels / this.config.pixelsPerHour) * 60;
  }

  getCreationRange(
    startMinutes: number,
    currentMinutes: number,
  ): DragSelection {
    const start = snapMinutes(startMinutes, this.config.snapMinutes);

    const end = snapMinutes(currentMinutes, this.config.snapMinutes);

    return normalizeRange(start, end);
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

  /**
   * Resize the beginning of a block.
   */
  getResizedStart(
    originalEnd: number,
    currentMinutes: number,
    minimumDuration = 15,
  ): number {
    const snapped = snapMinutes(currentMinutes, this.config.snapMinutes);

    return clampMinutes(
      snapped,
      this.config.dayStart,
      originalEnd - minimumDuration,
    );
  }

  /**
   * Resize the end of a block.
   */
  getResizedEnd(
    originalStart: number,
    currentMinutes: number,
    minimumDuration = 15,
  ): number {
    const snapped = snapMinutes(currentMinutes, this.config.snapMinutes);

    return clampMinutes(
      snapped,
      originalStart + minimumDuration,
      this.config.dayEnd,
    );
  }
}
