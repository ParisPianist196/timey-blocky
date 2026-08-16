import { randomColor } from "@lib/colors";
import type { TimeBlock } from "@lib/timeline/types";
import { BlockInteraction } from "./BlockInteraction";
import { TimelineInteractions } from "../stores/TimelineInteractions";

export class CreateBlockInteraction extends BlockInteraction {
  constructor(interactions: TimelineInteractions, event: PointerEvent) {
    const minutes = interactions.pointerToMinutes(event);

    const creationBlock: TimeBlock = {
      id: "test",
      start: minutes,
      end: minutes,
      top: 0,
      height: 0,
      color: randomColor(),
      label: "",
    };

    super(interactions, creationBlock);
    super.pointerStartAction(event);
  }

  override pointerMoveAction(event: PointerEvent): number | undefined {
    if (!this.localBlock) {
      return;
    }

    const currentMinutes = super.pointerMoveAction(event);

    if (currentMinutes === undefined) {
      return;
    }

    const range = this.timelineInteractions.getCreationRange(
      this.initialBlock.start,
      currentMinutes,
    );

    this.localBlock = {
      ...this.localBlock,
      start: range.start,
      end: range.end,
      top: this.timelineInteractions.minutesToPixels(range.start),
      height:
        this.timelineInteractions.minutesToPixels(range.end) -
        this.timelineInteractions.minutesToPixels(range.start),
    };
  }
}
