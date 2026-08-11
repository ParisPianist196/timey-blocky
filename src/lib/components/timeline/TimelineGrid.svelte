<script lang="ts">
  import type { DragSelection, InteractionState } from "@timeline/interactions";

  import {
    getCreationRange,
    getMovedBlockRange,
    getResizedEnd,
    getResizedStart,
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
    onblockresize,
  }: Props = $props();

  let gridElement = $state<HTMLElement | null>(null);

  let interaction = $state<InteractionState>({
    type: "idle",
  });

  let creationStartMinutes = $state(0);
  let creationCurrentMinutes = $state(0);

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  function blockTop(block: TimeBlock): number {
    return ((block.start - config.dayStart) / 60) * config.pixelsPerHour;
  }

  function blockHeight(block: TimeBlock): number {
    return ((block.end - block.start) / 60) * config.pixelsPerHour;
  }

  function formatHour(minutes: number): string {
    const hours24 = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;

    if (hours24 === 24) {
      return "12 AM";
    }

    const period = hours24 >= 12 ? "PM" : "AM";

    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    if (minutesPart === 0) {
      return `${hours12} ${period}`;
    }

    return `${hours12}:${minutesPart.toString().padStart(2, "0")} ${period}`;
  }

  /**
   * Convert a pointer's client Y coordinate into
   * minutes on the timeline.
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
   * Start creating a new block.
   */
  function handleCreationPointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    const minutes = pointerToMinutes(event);

    creationStartMinutes = minutes;
    creationCurrentMinutes = minutes;

    interaction = {
      type: "creating",
      startMinutes: minutes,
      currentMinutes: minutes,
    };

    gridElement?.setPointerCapture(event.pointerId);

    event.preventDefault();
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

    const currentMinutes = pointerToMinutes(event);

    const offsetMinutes = currentMinutes - block.start;

    interaction = {
      type: "moving",
      blockId: block.id,
      startMinutes: block.start,
      currentMinutes,
      offsetMinutes,
    };

    gridElement?.setPointerCapture(event.pointerId);

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Start resizing the beginning of a block.
   */
  function handleResizeStart(event: PointerEvent, block: TimeBlock) {
    if (event.button !== 0) {
      return;
    }

    if (editingBlockId === block.id) {
      return;
    }

    const currentMinutes = pointerToMinutes(event);

    interaction = {
      type: "resizing-start",
      blockId: block.id,
      originalStart: block.start,
      originalEnd: block.end,
      currentMinutes,
    };

    /*
     * The GRID owns pointer capture for every interaction.
     * This means the pointer can leave the handle while
     * we continue receiving pointermove events.
     */
    gridElement?.setPointerCapture(event.pointerId);

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Start resizing the end of a block.
   */
  function handleResizeEnd(event: PointerEvent, block: TimeBlock) {
    if (event.button !== 0) {
      return;
    }

    if (editingBlockId === block.id) {
      return;
    }

    const currentMinutes = pointerToMinutes(event);

    interaction = {
      type: "resizing-end",
      blockId: block.id,
      originalStart: block.start,
      originalEnd: block.end,
      currentMinutes,
    };

    gridElement?.setPointerCapture(event.pointerId);

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle all pointer movement from the grid.
   */
  function handlePointerMove(event: PointerEvent) {
    if (interaction.type === "creating") {
      creationCurrentMinutes = pointerToMinutes(event);

      interaction = {
        ...interaction,
        currentMinutes: creationCurrentMinutes,
      };

      return;
    }

    if (interaction.type === "moving") {
      handleMovePointerMove(event);
      return;
    }

    if (
      interaction.type === "resizing-start" ||
      interaction.type === "resizing-end"
    ) {
      handleResizePointerMove(event);
    }
  }

  /**
   * Move a block.
   */
  function handleMovePointerMove(event: PointerEvent) {
    if (interaction.type !== "moving") {
      return;
    }

    // Capture the narrowed values before updating interaction.
    const blockId = interaction.blockId;
    const offsetMinutes = interaction.offsetMinutes;

    const block = blocks.find((candidate) => candidate.id === blockId);

    if (!block) {
      return;
    }

    const currentMinutes = pointerToMinutes(event);

    const range = getMovedBlockRange(
      block,
      currentMinutes,
      offsetMinutes,
      config.dayStart,
      config.dayEnd,
      config.snapMinutes,
    );

    interaction = {
      ...interaction,
      currentMinutes,
    };

    onblockmove?.(blockId, range.start, range.end);
  }
  /**
   * Resize a block.
   */
  function handleResizePointerMove(event: PointerEvent) {
    if (
      interaction.type !== "resizing-start" &&
      interaction.type !== "resizing-end"
    ) {
      return;
    }

    const currentMinutes = pointerToMinutes(event);

    let start = interaction.originalStart;
    let end = interaction.originalEnd;

    if (interaction.type === "resizing-start") {
      start = getResizedStart(
        interaction.originalEnd,
        currentMinutes,
        config.dayStart,
        config.snapMinutes,
      );
    } else {
      end = getResizedEnd(
        interaction.originalStart,
        currentMinutes,
        config.dayEnd,
        config.snapMinutes,
      );
    }

    interaction = {
      ...interaction,
      currentMinutes,
    };

    onblockresize?.(interaction.blockId, start, end);
  }

  /**
   * Handle pointer up for every interaction.
   */
  function handlePointerUp(event: PointerEvent) {
    if (interaction.type === "creating") {
      finishCreation(event);
      return;
    }

    if (interaction.type === "moving") {
      finishMove(event);
      return;
    }

    if (
      interaction.type === "resizing-start" ||
      interaction.type === "resizing-end"
    ) {
      finishResize(event);
    }
  }

  /**
   * Finish creating a block.
   */
  function finishCreation(event: PointerEvent) {
    if (interaction.type !== "creating") {
      return;
    }

    const range = getCreationRange(
      creationStartMinutes,
      creationCurrentMinutes,
      config.snapMinutes,
    );

    releasePointer(event.pointerId);

    interaction = {
      type: "idle",
    };

    if (range.start === range.end) {
      return;
    }

    oncreateblock?.(range);
  }

  /**
   * Finish moving a block.
   */
  function finishMove(event: PointerEvent) {
    if (interaction.type !== "moving") {
      return;
    }

    releasePointer(event.pointerId);

    interaction = {
      type: "idle",
    };
  }

  /**
   * Finish resizing a block.
   */
  function finishResize(event: PointerEvent) {
    if (
      interaction.type !== "resizing-start" &&
      interaction.type !== "resizing-end"
    ) {
      return;
    }

    releasePointer(event.pointerId);

    interaction = {
      type: "idle",
    };
  }

  /**
   * Handle any pointer cancellation.
   */
  function handlePointerCancel(event: PointerEvent) {
    releasePointer(event.pointerId);

    interaction = {
      type: "idle",
    };
  }

  /**
   * Release grid pointer capture safely.
   */
  function releasePointer(pointerId: number) {
    if (gridElement?.hasPointerCapture(pointerId)) {
      gridElement.releasePointerCapture(pointerId);
    }
  }

  const creationRange = $derived.by(() => {
    if (interaction.type !== "creating") {
      return null;
    }

    return getCreationRange(
      creationStartMinutes,
      creationCurrentMinutes,
      config.snapMinutes,
    );
  });

  const creationTop = $derived(
    creationRange
      ? blockTop({
          id: "__creation__",
          start: creationRange.start,
          end: creationRange.end,
          color: "",
          label: "",
        })
      : 0,
  );

  const creationHeight = $derived(
    creationRange
      ? blockHeight({
          id: "__creation__",
          start: creationRange.start,
          end: creationRange.end,
          color: "",
          label: "",
        })
      : 0,
  );
</script>

<div
  bind:this={gridElement}
  class="grid"
  style:height={`${totalHeight}px`}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
>
  <!--
    This button is the empty timeline surface used to
    create new blocks.
  -->
  <button
    class="creation-surface"
    type="button"
    aria-label="Create a time block"
    onpointerdown={handleCreationPointerDown}
  ></button>

  <div class="blocks">
    {#each blocks as block (block.id)}
      <TimelineBlock
        {block}
        {config}
        top={blockTop(block)}
        height={blockHeight(block)}
        editing={editingBlockId === block.id}
        onpointerdown={(event) => handleBlockPointerDown(event, block)}
        onresizestart={(event) => handleResizeStart(event, block)}
        onresizeend={(event) => handleResizeEnd(event, block)}
        ontitlechange={(title) => onblocktitlechange?.(block.id, title)}
        oncancel={() => oncancelblock?.(block.id)}
      />
    {/each}

    {#if creationRange && creationHeight > 0}
      <div
        class="creation-preview"
        style:top={`${creationTop}px`}
        style:height={`${creationHeight}px`}
      >
        <span>
          {formatHour(creationRange.start)}
          –
          {formatHour(creationRange.end)}
        </span>
      </div>
    {/if}
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

  .blocks {
    position: absolute;

    inset: 0;

    pointer-events: none;
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
  }
</style>
