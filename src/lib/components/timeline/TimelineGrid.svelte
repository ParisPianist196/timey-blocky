<script lang="ts">
  import type { DragSelection, InteractionState } from "@timeline/interactions";

  import {
    getCreationRange,
    getResizedEnd,
    getResizedStart,
    getMovedBlockRange,
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

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  let interaction = $state<InteractionState>({
    type: "idle",
  });

  let creationStartMinutes = $state(0);
  let creationCurrentMinutes = $state(0);

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
   * Convert a pointer's client Y coordinate into timeline minutes.
   */
  function pointerToMinutes(event: PointerEvent, surface: HTMLElement): number {
    const rect = surface.getBoundingClientRect();

    const pixels = event.clientY - rect.top;

    const minutes = pixelsToMinutes(
      pixels,
      config.dayStart,
      config.pixelsPerHour,
    );

    return Math.max(config.dayStart, Math.min(minutes, config.dayEnd));
  }

  /**
   * Find the timeline grid from a pointer event.
   */
  function getGridFromPointer(event: PointerEvent): HTMLElement | null {
    const element = event.currentTarget as HTMLElement;

    const grid = element.closest(".grid");

    return grid instanceof HTMLElement ? grid : null;
  }

  /**
   * Start creating a new block.
   */
  function handleCreationPointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    const surface = event.currentTarget as HTMLElement;

    const minutes = pointerToMinutes(event, surface);

    creationStartMinutes = minutes;
    creationCurrentMinutes = minutes;

    interaction = {
      type: "creating",
      startMinutes: minutes,
      currentMinutes: minutes,
    };

    surface.setPointerCapture(event.pointerId);
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

    const grid = getGridFromPointer(event);

    if (!grid) {
      return;
    }

    const currentMinutes = pointerToMinutes(event, grid);

    const offsetMinutes = currentMinutes - block.start;

    interaction = {
      type: "moving",
      blockId: block.id,
      startMinutes: block.start,
      currentMinutes,
      offsetMinutes,
    };

    const blockElement = event.currentTarget as HTMLElement;

    blockElement.setPointerCapture(event.pointerId);

    event.preventDefault();
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

    const grid = getGridFromPointer(event);

    if (!grid) {
      return;
    }

    const currentMinutes = pointerToMinutes(event, grid);

    interaction = {
      type: "resizing-start",
      blockId: block.id,
      originalStart: block.start,
      originalEnd: block.end,
      currentMinutes,
    };

    const handle = event.currentTarget as HTMLElement;

    handle.setPointerCapture(event.pointerId);

    event.preventDefault();
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

    const grid = getGridFromPointer(event);

    if (!grid) {
      return;
    }

    const currentMinutes = pointerToMinutes(event, grid);

    interaction = {
      type: "resizing-end",
      blockId: block.id,
      originalStart: block.start,
      originalEnd: block.end,
      currentMinutes,
    };

    const handle = event.currentTarget as HTMLElement;

    handle.setPointerCapture(event.pointerId);

    event.preventDefault();
  }

  /**
   * Handle pointer movement while creating.
   */
  function handleCreationPointerMove(event: PointerEvent) {
    if (interaction.type !== "creating") {
      return;
    }

    const surface = event.currentTarget as HTMLElement;

    creationCurrentMinutes = pointerToMinutes(event, surface);

    interaction = {
      ...interaction,
      currentMinutes: creationCurrentMinutes,
    };
  }

  /**
   * Handle pointer movement while moving a block.
   */
  function handleBlockPointerMove(event: PointerEvent) {
    if (interaction.type !== "moving") {
      return;
    }

    const { blockId, offsetMinutes } = interaction;

    const block = blocks.find((candidate) => candidate.id === blockId);

    if (!block) {
      return;
    }

    const grid = getGridFromPointer(event);

    if (!grid) {
      return;
    }

    const currentMinutes = pointerToMinutes(event, grid);

    const range = getMovedBlockRange(
      block,
      currentMinutes,
      offsetMinutes,
      config.dayStart,
      config.dayEnd,
      config.snapMinutes,
    );

    onblockmove?.(block.id, range.start, range.end);
  }

  /**
   * Handle pointer movement while resizing a block.
   */
  function handleResizePointerMove(event: PointerEvent) {
    if (
      interaction.type !== "resizing-start" &&
      interaction.type !== "resizing-end"
    ) {
      return;
    }

    const { blockId, originalStart, originalEnd } = interaction;

    const grid = getGridFromPointer(event);

    if (!grid) {
      return;
    }

    const currentMinutes = pointerToMinutes(event, grid);

    let start = originalStart;
    let end = originalEnd;

    if (interaction.type === "resizing-start") {
      start = getResizedStart(
        originalEnd,
        currentMinutes,
        config.dayStart,
        config.snapMinutes,
      );
    } else {
      end = getResizedEnd(
        originalStart,
        currentMinutes,
        config.dayEnd,
        config.snapMinutes,
      );
    }

    interaction = {
      ...interaction,
      currentMinutes,
    };

    onblockresize?.(blockId, start, end);
  }

  /**
   * Finish creation.
   */
  function handleCreationPointerUp(event: PointerEvent) {
    if (interaction.type !== "creating") {
      return;
    }

    const surface = event.currentTarget as HTMLElement;

    const range = getCreationRange(
      creationStartMinutes,
      creationCurrentMinutes,
      config.snapMinutes,
    );

    interaction = {
      type: "idle",
    };

    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
    }

    if (range.start === range.end) {
      return;
    }

    oncreateblock?.(range);
  }

  /**
   * Finish moving.
   */
  function handleBlockPointerUp(event: PointerEvent) {
    if (interaction.type !== "moving") {
      return;
    }

    const blockElement = event.currentTarget as HTMLElement;

    interaction = {
      type: "idle",
    };

    if (blockElement.hasPointerCapture(event.pointerId)) {
      blockElement.releasePointerCapture(event.pointerId);
    }
  }

  /**
   * Finish resizing.
   */
  function handleResizePointerUp(event: PointerEvent) {
    if (
      interaction.type !== "resizing-start" &&
      interaction.type !== "resizing-end"
    ) {
      return;
    }

    const handle = event.currentTarget as HTMLElement;

    interaction = {
      type: "idle",
    };

    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
  }

  /**
   * Cancel creation.
   */
  function handleCreationPointerCancel(event: PointerEvent) {
    if (interaction.type !== "creating") {
      return;
    }

    const surface = event.currentTarget as HTMLElement;

    interaction = {
      type: "idle",
    };

    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
    }
  }

  /**
   * Cancel moving.
   */
  function handleBlockPointerCancel(event: PointerEvent) {
    if (interaction.type !== "moving") {
      return;
    }

    const blockElement = event.currentTarget as HTMLElement;

    interaction = {
      type: "idle",
    };

    if (blockElement.hasPointerCapture(event.pointerId)) {
      blockElement.releasePointerCapture(event.pointerId);
    }
  }

  /**
   * Cancel resizing.
   */
  function handleResizePointerCancel(event: PointerEvent) {
    if (
      interaction.type !== "resizing-start" &&
      interaction.type !== "resizing-end"
    ) {
      return;
    }

    const handle = event.currentTarget as HTMLElement;

    interaction = {
      type: "idle",
    };

    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
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

<div class="grid" style:height={`${totalHeight}px`}>
  <button
    class="creation-surface"
    type="button"
    aria-label="Create a time block"
    onpointerdown={handleCreationPointerDown}
    onpointermove={handleCreationPointerMove}
    onpointerup={handleCreationPointerUp}
    onpointercancel={handleCreationPointerCancel}
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
        onpointermove={handleBlockPointerMove}
        onpointerup={handleBlockPointerUp}
        onpointercancel={handleBlockPointerCancel}
        onresizestart={(event) => handleResizeStart(event, block)}
        onresizeend={(event) => handleResizeEnd(event, block)}
        onresizepointermove={handleResizePointerMove}
        onresizepointerup={handleResizePointerUp}
        onresizepointercancel={handleResizePointerCancel}
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
  }

  .creation-surface {
    position: absolute;
    inset: 0;

    width: 100%;
    height: 100%;

    margin: 0;
    padding: 0;

    border: 0;
    border-radius: 0;

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
