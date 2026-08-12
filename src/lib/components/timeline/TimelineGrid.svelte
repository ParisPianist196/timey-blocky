<script lang="ts">
  import type { DragSelection, InteractionState } from "@timeline/interactions";

  import {
    getCreationRange,
    getMovedBlockRange,
    getResizedEnd,
    getResizedStart,
    minutesToPixels,
    pixelsToMinutes,
  } from "@timeline/interactions";

  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  import TimelineBlock from "./TimelineBlock.svelte";

  interface Props {
    config: TimelineConfig;
    blocks: TimeBlock[];

    editingBlockId?: string | null;

    oncreateblock?: (range: DragSelection) => void;

    onblocktitlechange?: (blockId: string, title: string) => void;

    oncancelblock?: (blockId: string) => void;

    onblockmove?: (blockId: string, start: number, end: number) => void;

    onblockmoveend?: (
      blockId: string,
      start: number,
      end: number,
      originalStart: number,
      originalEnd: number,
    ) => void;

    onblockresize?: (blockId: string, start: number, end: number) => void;
  }

  let {
    config,
    blocks,
    editingBlockId = null,

    oncreateblock,
    onblocktitlechange,
    oncancelblock,

    onblockmove,
    onblockmoveend,
    onblockresize,
  }: Props = $props();

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  let interaction = $state<InteractionState>({
    type: "idle",
  });

  let primaryPointerId = $state<number | null>(null);

  function blockTop(block: TimeBlock): number {
    return ((block.start - config.dayStart) / 60) * config.pixelsPerHour;
  }

  function blockHeight(block: TimeBlock): number {
    return ((block.end - block.start) / 60) * config.pixelsPerHour;
  }

  /**
   * Convert a pointer's client Y coordinate
   * into timeline minutes.
   *
   * The event target is the creation button,
   * which fills the timeline.
   */
  function pointerToMinutes(event: PointerEvent): number {
    const target = event.currentTarget as HTMLElement;

    const rect = target.getBoundingClientRect();

    const pixels = event.clientY - rect.top;

    const minutes = pixelsToMinutes(
      pixels,
      config.dayStart,
      config.pixelsPerHour,
    );

    return Math.max(config.dayStart, Math.min(minutes, config.dayEnd));
  }

  /**
   * Capture the pointer on the element
   * that initiated the interaction.
   */
  function capturePointer(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement;

    primaryPointerId = event.pointerId;

    target.setPointerCapture(event.pointerId);
  }

  /**
   * Release the active pointer capture.
   */
  function releasePointer(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    primaryPointerId = null;
  }

  /**
   * Start creating a new block.
   */
  function handleCreationPointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const minutes = pointerToMinutes(event);

    interaction = {
      type: "creating",
      startMinutes: minutes,
      currentMinutes: minutes,
    };

    capturePointer(event);
  }

  /**
   * Begin moving a block.
   */
  function handleBlockPointerDown(block: TimeBlock, event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentMinutes = pointerToMinutes(event);

    interaction = {
      type: "moving",
      blockId: block.id,
      originalStart: block.start,
      originalEnd: block.end,
      currentMinutes,
      offsetMinutes: currentMinutes - block.start,
    };

    capturePointer(event);
  }

  /**
   * Begin resizing the start of a block.
   */
  function handleResizeStart(block: TimeBlock, event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    interaction = {
      type: "resizing-start",
      blockId: block.id,
      originalStart: block.start,
      originalEnd: block.end,
      currentMinutes: pointerToMinutes(event),
    };

    capturePointer(event);
  }

  /**
   * Begin resizing the end of a block.
   */
  function handleResizeEnd(block: TimeBlock, event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    interaction = {
      type: "resizing-end",
      blockId: block.id,
      originalStart: block.start,
      originalEnd: block.end,
      currentMinutes: pointerToMinutes(event),
    };

    capturePointer(event);
  }

  /**
   * Handle pointer movement for the
   * active interaction.
   */
  function handlePointerMove(event: PointerEvent) {
    if (primaryPointerId !== null && event.pointerId !== primaryPointerId) {
      return;
    }

    const currentInteraction = interaction;

    /*
     * Creating
     */
    if (currentInteraction.type === "creating") {
      interaction = {
        ...currentInteraction,
        currentMinutes: pointerToMinutes(event),
      };

      return;
    }

    /*
     * Moving
     */
    if (currentInteraction.type === "moving") {
      const block = blocks.find(
        (candidate) => candidate.id === currentInteraction.blockId,
      );

      if (!block) {
        return;
      }

      const currentMinutes = pointerToMinutes(event);

      const range = getMovedBlockRange(
        block,
        currentMinutes,
        currentInteraction.offsetMinutes,
        config.dayStart,
        config.dayEnd,
        config.snapMinutes,
      );

      interaction = {
        ...currentInteraction,
        currentMinutes,
      };

      onblockmove?.(block.id, range.start, range.end);

      return;
    }

    /*
     * Resizing start
     */
    if (currentInteraction.type === "resizing-start") {
      const currentMinutes = pointerToMinutes(event);

      const start = getResizedStart(
        currentInteraction.originalEnd,
        currentMinutes,
        config.dayStart,
        config.snapMinutes,
      );

      interaction = {
        ...currentInteraction,
        currentMinutes,
      };

      onblockresize?.(
        currentInteraction.blockId,
        start,
        currentInteraction.originalEnd,
      );

      return;
    }

    /*
     * Resizing end
     */
    if (currentInteraction.type === "resizing-end") {
      const currentMinutes = pointerToMinutes(event);

      const end = getResizedEnd(
        currentInteraction.originalStart,
        currentMinutes,
        config.dayEnd,
        config.snapMinutes,
      );

      interaction = {
        ...currentInteraction,
        currentMinutes,
      };

      onblockresize?.(
        currentInteraction.blockId,
        currentInteraction.originalStart,
        end,
      );
    }
  }

  /**
   * Finish the current interaction.
   */
  function handlePointerUp(event: PointerEvent) {
    if (primaryPointerId !== null && event.pointerId !== primaryPointerId) {
      return;
    }

    const currentInteraction = interaction;

    /*
     * Finish creation.
     */
    if (currentInteraction.type === "creating") {
      const range = getCreationRange(
        currentInteraction.startMinutes,
        currentInteraction.currentMinutes,
        config.snapMinutes,
      );

      interaction = {
        type: "idle",
      };

      releasePointer(event);

      if (range.start !== range.end) {
        oncreateblock?.(range);
      }

      return;
    }

    /*
     * Finish moving.
     */
    if (currentInteraction.type === "moving") {
      const block = blocks.find(
        (candidate) => candidate.id === currentInteraction.blockId,
      );

      if (block) {
        const range = getMovedBlockRange(
          block,
          currentInteraction.currentMinutes,
          currentInteraction.offsetMinutes,
          config.dayStart,
          config.dayEnd,
          config.snapMinutes,
        );

        onblockmoveend?.(
          block.id,
          range.start,
          range.end,
          currentInteraction.originalStart,
          currentInteraction.originalEnd,
        );
      }

      interaction = {
        type: "idle",
      };

      releasePointer(event);

      return;
    }

    /*
     * Finish resizing start.
     */
    if (currentInteraction.type === "resizing-start") {
      const start = getResizedStart(
        currentInteraction.originalEnd,
        currentInteraction.currentMinutes,
        config.dayStart,
        config.snapMinutes,
      );

      onblockresize?.(
        currentInteraction.blockId,
        start,
        currentInteraction.originalEnd,
      );

      interaction = {
        type: "idle",
      };

      releasePointer(event);

      return;
    }

    /*
     * Finish resizing end.
     */
    if (currentInteraction.type === "resizing-end") {
      const end = getResizedEnd(
        currentInteraction.originalStart,
        currentInteraction.currentMinutes,
        config.dayEnd,
        config.snapMinutes,
      );

      onblockresize?.(
        currentInteraction.blockId,
        currentInteraction.originalStart,
        end,
      );

      interaction = {
        type: "idle",
      };

      releasePointer(event);

      return;
    }

    interaction = {
      type: "idle",
    };

    releasePointer(event);
  }

  /**
   * Cancel the active interaction.
   */
  function handlePointerCancel(event: PointerEvent) {
    if (primaryPointerId !== null && event.pointerId !== primaryPointerId) {
      return;
    }

    interaction = {
      type: "idle",
    };

    releasePointer(event);
  }

  const creationRange = $derived.by(() => {
    const currentInteraction = interaction;

    if (currentInteraction.type !== "creating") {
      return null;
    }

    return getCreationRange(
      currentInteraction.startMinutes,
      currentInteraction.currentMinutes,
      config.snapMinutes,
    );
  });

  const creationTop = $derived(
    creationRange
      ? minutesToPixels(
          creationRange.start,
          config.dayStart,
          config.pixelsPerHour,
        )
      : 0,
  );

  const creationHeight = $derived(
    creationRange
      ? minutesToPixels(
          creationRange.end - creationRange.start,
          0,
          config.pixelsPerHour,
        )
      : 0,
  );
</script>

<div class="grid" style:height={`${totalHeight}px`}>
  <!--
    Native button owns the empty timeline interaction.

    This is intentionally NOT a div with pointer events.
  -->
  <button
    class="creation-surface"
    type="button"
    aria-label="Create time block"
    onpointerdown={handleCreationPointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerCancel}
  ></button>

  {#if creationRange && creationHeight > 0}
    <div
      class="creation-preview"
      style:top={`${creationTop}px`}
      style:height={`${creationHeight}px`}
    >
      <span>
        {Math.floor(creationRange.start / 60)}
        :
        {String(creationRange.start % 60).padStart(2, "0")}
        –
        {Math.floor(creationRange.end / 60)}
        :
        {String(creationRange.end % 60).padStart(2, "0")}
      </span>
    </div>
  {/if}

  <div class="blocks">
    {#each blocks as block (block.id)}
      <TimelineBlock
        {block}
        {config}
        top={blockTop(block)}
        height={blockHeight(block)}
        editing={editingBlockId === block.id}
        onpointerdown={(event) => handleBlockPointerDown(block, event)}
        onresizestart={(event) => handleResizeStart(block, event)}
        onresizeend={(event) => handleResizeEnd(block, event)}
        ontitlechange={(title) => onblocktitlechange?.(block.id, title)}
        oncancel={() => oncancelblock?.(block.id)}
      />
    {/each}
  </div>
</div>

<style>
  .grid {
    position: relative;

    height: 100%;

    user-select: none;

    touch-action: none;
  }

  .creation-surface {
    position: absolute;

    inset: 0;

    width: 100%;
    height: 100%;

    margin: 0;
    padding: 0;

    border: 0;

    background: transparent;

    cursor: crosshair;

    touch-action: none;
  }

  .creation-surface:focus-visible {
    outline: 2px solid #6366f1;

    outline-offset: -2px;
  }

  .creation-preview {
    position: absolute;

    left: 48px;
    right: 0;

    box-sizing: border-box;

    border: 2px dashed #6366f1;

    border-radius: 8px;

    background: rgb(99 102 241 / 0.15);

    pointer-events: none;

    display: flex;

    align-items: flex-start;

    padding: 6px 10px;

    color: #4338ca;

    font-size: 12px;

    font-weight: 500;

    z-index: 2;
  }

  .blocks {
    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 3;
  }
</style>
