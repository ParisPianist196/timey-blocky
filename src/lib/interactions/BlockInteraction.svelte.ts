import type { TimeBlock } from "@lib/interactions/types";
import { addBlock, updateBlock } from "@stores/timelineBlocks.svelte";
import type { TimelineInteractions } from "@lib/interactions/TimelineInteractions";

export class BlockInteraction {
  curInteractingElement = $state<HTMLElement | null>(null);
  curPointerInteractionId = $state<number | null>(null);

  timelineInteractions: TimelineInteractions;
  initialBlock: TimeBlock;
  localBlock = $state<TimeBlock>();

  constructor(interactions: TimelineInteractions, block: TimeBlock) {
    this.timelineInteractions = interactions;
    this.initialBlock = { ...block };
    this.localBlock = { ...block };
  }

  pointerStartAction(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const element = event.currentTarget as HTMLElement;

    this.curInteractingElement = element;
    this.curPointerInteractionId = event.pointerId;

    element.setPointerCapture(event.pointerId);
  }

  pointerMoveAction(event: PointerEvent): number | undefined {
    if (
      this.curPointerInteractionId === null ||
      event.pointerId !== this.curPointerInteractionId ||
      !this.localBlock
    ) {
      return;
    }

    return this.timelineInteractions.pointerToMinutes(event);
  }

  async pointerEndAction(event: PointerEvent): Promise<void> {
    if (
      this.curPointerInteractionId === null ||
      event.pointerId !== this.curPointerInteractionId ||
      !this.localBlock
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const pointerId = this.curPointerInteractionId;
    const element = this.curInteractingElement;

    if (element?.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }

    this.curInteractingElement = null;
    this.curPointerInteractionId = null;

    const blockChanged =
      this.localBlock.start !== this.initialBlock.start ||
      this.localBlock.end !== this.initialBlock.end;

    if (!blockChanged) {
      return;
    }

    this.initialBlock = { ...this.localBlock };

    if (this.initialBlock.id === "test") {
      await addBlock(this.initialBlock);
    } else {
      await updateBlock(this.initialBlock.id, {
        start: this.localBlock.start,
        end: this.localBlock.end,
      });
    }
  }
}
