import type { TimeBlock } from "@lib/timeline/types";
import { BlockInteraction } from "./BlockInteraction";
import { TimelineInteractions } from "../stores/TimelineInteractions";

export class MoveBlockInteraction extends BlockInteraction {
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
}
