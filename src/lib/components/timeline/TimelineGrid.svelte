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

    onblockmoveend?: (
      blockId: string,
      start: number,
      end: number,
      originalStart: number,
      originalEnd: number,
    ) => void;

    onblockresizeend?: (
      blockId: string,
      start: number,
      end: number,
      originalStart: number,
      originalEnd: number,
    ) => void;
  }

  let {
    config,
    blocks,
    editingBlockId = null,

    oncreateblock,
    onblocktitlechange,
    oncancelblock,
    onblockmoveend,
    onblockresizeend,
  }: Props = $props();

  let gridElement = $state<HTMLElement | null>(null);

  let interaction = $state<InteractionState>({
    type: "idle",
  });

  let capturedElement = $state<HTMLElement | null>(null);

  let creationStartMinutes = $state(0);

  let creationCurrentMinutes = $state(0);

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  /**
   * Convert timeline minutes to a block's
   * vertical position.
   */
  function blockTop(block: TimeBlock): number {
    return ((block.start - config.dayStart) / 60) * config.pixelsPerHour;
  }

  /**
   * Convert a block duration into pixels.
   */
  function blockHeight(block: TimeBlock): number {
    return ((block.end - block.start) / 60) * config.pixelsPerHour;
  }

  /**
   * Convert a pointer's client Y coordinate
   * into timeline minutes.
   *
   * This always uses the actual grid's geometry,
   * regardless of which button started the interaction.
   */
  function pointerToMinutes(event: PointerEvent): number {
    if (!gridElement) {
      return config.dayStart;
    }

    const rect = gridElement.getBoundingClientRect();

    const pixels = event.clientY - rect.top;

    const minutes = pixelsToMinutes(
      pixels,
      config.dayStart,
      config.pixelsPerHour,
    );

    return Math.max(config.dayStart, Math.min(minutes, config.dayEnd));
  }

  /**
   * Start pointer capture on the element
   * that initiated the interaction.
   */
  function capturePointer(event: PointerEvent) {
    const element = event.currentTarget as HTMLElement;

    capturedElement = element;

    element.setPointerCapture(event.pointerId);
  }

  /**
   * Release the pointer from whichever
   * native button originally captured it.
   */
  function releasePointer(pointerId: number) {
    if (capturedElement?.hasPointerCapture(pointerId)) {
      capturedElement.releasePointerCapture(pointerId);
    }

    capturedElement = null;
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

    creationStartMinutes = minutes;
    creationCurrentMinutes = minutes;

    interaction = {
      type: "creating",
      startMinutes: minutes,
      currentMinutes: minutes,
    };

    capturePointer(event);
  }

  /**
   * Start moving an existing block.
   */
  function handleBlockPointerDown(event: PointerEvent, block: TimeBlock) {
    if (event.button !== 0) {
      return;
    }

    if (editingBlockId === block.id) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentMinutes = pointerToMinutes(event);

    const offsetMinutes = currentMinutes - block.start;

    interaction = {
      type: "moving",
      blockId: block.id,
      startMinutes: block.start,
      currentMinutes,
      offsetMinutes,
    };

    capturePointer(event);
  }

  /**
   * Start resizing the beginning
   * of an existing block.
   */
  function handleResizeStart(event: PointerEvent, block: TimeBlock) {
    if (event.button !== 0) {
      return;
    }

    if (editingBlockId === block.id) {
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
   * Start resizing the end
   * of an existing block.
   */
  function handleResizeEnd(event: PointerEvent, block: TimeBlock) {
    if (event.button !== 0) {
      return;
    }

    if (editingBlockId === block.id) {
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
   * Update the temporary interaction state.
   *
   * IMPORTANT:
   *
   * We do NOT call back into Timeline.svelte
   * here. That would update the entire blocks array
   * on every pointer event and cause the lag we were seeing.
   */
  function handlePointerMove(event: PointerEvent) {
    const currentInteraction = interaction;

    /*
     * Creating
     */
    if (currentInteraction.type === "creating") {
      const currentMinutes = pointerToMinutes(event);

      creationCurrentMinutes = currentMinutes;

      interaction = {
        ...currentInteraction,
        currentMinutes,
      };

      return;
    }

    /*
     * Moving
     */
    if (currentInteraction.type === "moving") {
      const currentMinutes = pointerToMinutes(event);

      interaction = {
        ...currentInteraction,
        currentMinutes,
      };

      return;
    }

    /*
     * Resizing the start.
     */
    if (currentInteraction.type === "resizing-start") {
      const currentMinutes = pointerToMinutes(event);

      interaction = {
        ...currentInteraction,
        currentMinutes,
      };

      return;
    }

    /*
     * Resizing the end.
     */
    if (currentInteraction.type === "resizing-end") {
      const currentMinutes = pointerToMinutes(event);

      interaction = {
        ...currentInteraction,
        currentMinutes,
      };
    }
  }

  /**
   * Finish the current interaction.
   */
  function handlePointerUp(event: PointerEvent) {
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

      releasePointer(event.pointerId);

      interaction = {
        type: "idle",
      };

      if (range.start !== range.end) {
        oncreateblock?.(range);
      }

      return;
    }

    /*
     * Finish moving.
     */
    if (currentInteraction.type === "moving") {
      const blockId = currentInteraction.blockId;

      const originalStart = currentInteraction.startMinutes;

      const block = blocks.find((candidate) => candidate.id === blockId);

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
          blockId,
          range.start,
          range.end,
          originalStart,
          currentInteraction.startMinutes + (block.end - block.start),
        );
      }

      releasePointer(event.pointerId);

      interaction = {
        type: "idle",
      };

      return;
    }

    /*
     * Finish resizing the start.
     */
    if (currentInteraction.type === "resizing-start") {
      const start = getResizedStart(
        currentInteraction.originalEnd,
        currentInteraction.currentMinutes,
        config.dayStart,
        config.snapMinutes,
      );

      onblockresizeend?.(
        currentInteraction.blockId,
        start,
        currentInteraction.originalEnd,
        currentInteraction.originalStart,
        currentInteraction.originalEnd,
      );

      releasePointer(event.pointerId);

      interaction = {
        type: "idle",
      };

      return;
    }

    /*
     * Finish resizing the end.
     */
    if (currentInteraction.type === "resizing-end") {
      const end = getResizedEnd(
        currentInteraction.originalStart,
        currentInteraction.currentMinutes,
        config.dayEnd,
        config.snapMinutes,
      );

      onblockresizeend?.(
        currentInteraction.blockId,
        currentInteraction.originalStart,
        end,
        currentInteraction.originalStart,
        currentInteraction.originalEnd,
      );

      releasePointer(event.pointerId);

      interaction = {
        type: "idle",
      };

      return;
    }
  }

  /**
   * Cancel the active interaction.
   */
  function handlePointerCancel(event: PointerEvent) {
    releasePointer(event.pointerId);

    interaction = {
      type: "idle",
    };
  }

  /**
   * Calculate the visual position of
   * a block during an active interaction.
   *
   * This is what makes dragging smooth:
   * the parent `blocks` array stays untouched
   * until pointerup.
   */
  function getVisualRange(block: TimeBlock): {
    start: number;
    end: number;
  } {
    const currentInteraction = interaction;

    if (
      currentInteraction.type === "moving" &&
      currentInteraction.blockId === block.id
    ) {
      return getMovedBlockRange(
        block,
        currentInteraction.currentMinutes,
        currentInteraction.offsetMinutes,
        config.dayStart,
        config.dayEnd,
        config.snapMinutes,
      );
    }

    if (
      currentInteraction.type === "resizing-start" &&
      currentInteraction.blockId === block.id
    ) {
      return {
        start: getResizedStart(
          currentInteraction.originalEnd,
          currentInteraction.currentMinutes,
          config.dayStart,
          config.snapMinutes,
        ),
        end: currentInteraction.originalEnd,
      };
    }

    if (
      currentInteraction.type === "resizing-end" &&
      currentInteraction.blockId === block.id
    ) {
      return {
        start: currentInteraction.originalStart,
        end: getResizedEnd(
          currentInteraction.originalStart,
          currentInteraction.currentMinutes,
          config.dayEnd,
          config.snapMinutes,
        ),
      };
    }

    return {
      start: block.start,
      end: block.end,
    };
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

<svelte:window
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
/>

<div bind:this={gridElement} class="grid" style:height={`${totalHeight}px`}>
  <!--
    Empty timeline surface.

    This is the only element responsible for
    starting block creation.
  -->
  <button
    class="creation-surface"
    type="button"
    aria-label="Create a time block"
    onpointerdown={handleCreationPointerDown}
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
      {@const visualRange = getVisualRange(block)}

      {@const visualBlock = {
        ...block,
        start: visualRange.start,
        end: visualRange.end,
      }}

      <TimelineBlock
        block={visualBlock}
        {config}
        top={blockTop(visualBlock)}
        height={blockHeight(visualBlock)}
        editing={editingBlockId === block.id}
        onpointerdown={(event) => handleBlockPointerDown(event, block)}
        onresizestart={(event) => handleResizeStart(event, block)}
        onresizeend={(event) => handleResizeEnd(event, block)}
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

  .blocks {
    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 3;
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
</style>
