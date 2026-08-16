import type { EdgeHandle, TimeBlock } from "@lib/interactions/types";
import { BlockInteraction } from "./BlockInteraction.svelte";
import { TimelineInteractions } from "@lib/interactions/TimelineInteractions";

export class UpdateBlockInteraction extends BlockInteraction {
  curOffsetMinutes = 0;

  constructor(block: TimeBlock, interactions: TimelineInteractions) {
    super(interactions, block);
  }

  override pointerStartAction(event: PointerEvent): void {
    super.pointerStartAction(event);

    const currentMinutes = this.timelineInteractions.pointerToMinutes(event);

    this.curOffsetMinutes = currentMinutes - this.initialBlock.start;
  }

  override pointerMoveAction(event: PointerEvent): number | undefined {
    const currentMinutes = super.pointerMoveAction(event);

    if (currentMinutes === undefined || !this.localBlock) {
      return;
    }

    const range = this.timelineInteractions.getMovedBlockRange(
      this.initialBlock,
      currentMinutes,
      this.curOffsetMinutes,
    );

    this.localBlock = {
      ...this.localBlock,
      start: range.start,
      end: range.end,
    };
  }

  resizeAction(event: PointerEvent, edge: EdgeHandle): number | undefined {
    const currentMinutes = super.pointerMoveAction(event);

    if (currentMinutes === undefined || !this.localBlock) {
      return;
    }

    if (edge === "start") {
      const start = this.timelineInteractions.getResizedStart(
        this.initialBlock.end,
        currentMinutes,
      );

      this.localBlock = {
        ...this.localBlock,
        start,
      };
    } else {
      const end = this.timelineInteractions.getResizedEnd(
        this.initialBlock.start,
        currentMinutes,
      );

      this.localBlock = {
        ...this.localBlock,
        end,
      };
    }
  }
}
