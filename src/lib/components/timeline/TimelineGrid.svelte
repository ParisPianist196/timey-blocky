<script lang="ts">
  import {
    getCreationRange,
    TimelineInteractions,
  } from "@stores/interactions.svelte";

  import type {
    CreatingBlock,
    TimeBlock,
    TimelineConfig,
  } from "@timeline/types";

  import { addBlock, timelineState } from "@lib/stores/timelineBlocks.svelte";

  import TimelineBlock from "./TimelineBlock.svelte";
  import { onMount } from "svelte";
  import { randomColor } from "@lib/colors";

  interface Props {
    config: TimelineConfig;
  }

  let { config }: Props = $props();

  let gridElement = $state<HTMLElement | null>();
  let creationBlock = $state<CreatingBlock | null>(null);
  let creationPointerId = $state<number | null>(null);
  let interactions = $state<TimelineInteractions>();

  const totalMinutes = $derived(config.dayEnd - config.dayStart);
  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  $effect(() => {
    if (!gridElement) return;
    interactions = new TimelineInteractions(
      config,
      gridElement.getBoundingClientRect(),
    );
  });

  /**
   * Start creating a new block.
   */
  function handleCreationPointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }
    if (!interactions) return;

    event.preventDefault();

    const minutes = interactions.pointerToMinutes(event);

    creationPointerId = event.pointerId;

    creationBlock = {
      start: minutes,
      end: minutes,
      top: 0,
      height: 0,
      color: "",
      label: "",
    };

    const target = event.currentTarget as HTMLElement;

    target.setPointerCapture(event.pointerId);
  }

  /**
   * Update the local creation preview.
   *
   * Nothing is persisted here.
   */
  function handleCreationPointerMove(event: PointerEvent) {
    if (!interactions) return;
    if (creationPointerId !== event.pointerId) {
      return;
    }

    if (!creationBlock) {
      return;
    }

    const currentMinutes = interactions.pointerToMinutes(event);

    const range = getCreationRange(
      creationBlock.start,
      currentMinutes,
      config.snapMinutes,
    );

    creationBlock = {
      ...creationBlock,
      end: currentMinutes,
      top: ((range.start - config.dayStart) / 60) * config.pixelsPerHour,
      height: ((range.end - range.start) / 60) * config.pixelsPerHour,
    };
  }

  /**
   * Finish creating the block and persist it.
   */
  async function handleCreationPointerUp(event: PointerEvent) {
    if (creationPointerId !== event.pointerId) {
      return;
    }

    if (!creationBlock) {
      return;
    }

    const range = getCreationRange(
      creationBlock.start,
      creationBlock.end,
      config.snapMinutes,
    );

    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    creationBlock = null;
    creationPointerId = null;

    if (range.start === range.end) {
      return;
    }

    const block: TimeBlock = {
      id: crypto.randomUUID(),
      start: range.start,
      end: range.end,
      color: randomColor(),
      label: "",
    };

    try {
      await addBlock(block);
    } catch (error) {
      console.error("Failed to create block:", error);
    }
  }

  /**
   * Cancel creation.
   */
  function handleCreationPointerCancel(event: PointerEvent) {
    if (creationPointerId !== event.pointerId) {
      return;
    }

    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    creationBlock = null;
    creationPointerId = null;
  }
</script>

<div bind:this={gridElement} class="grid" style:height={`${totalHeight}px`}>
  {#if interactions}
    <!-- Creation surface -->
    <button
      class="creation-surface"
      type="button"
      aria-label="Create a time block"
      onpointerdown={handleCreationPointerDown}
      onpointermove={handleCreationPointerMove}
      onpointerup={handleCreationPointerUp}
      onpointercancel={handleCreationPointerCancel}
    ></button>

    {#if creationBlock && creationBlock.height > 0}
      <div
        class="creation-preview"
        style:top={`${creationBlock.top}px`}
        style:height={`${creationBlock.height}px`}
      >
        <span>
          {Math.floor(
            getCreationRange(
              creationBlock.start,
              creationBlock.end,
              config.snapMinutes,
            ).start / 60,
          )}
          :
          {String(
            getCreationRange(
              creationBlock.start,
              creationBlock.end,
              config.snapMinutes,
            ).start % 60,
          ).padStart(2, "0")}
          –
          {Math.floor(
            getCreationRange(
              creationBlock.start,
              creationBlock.end,
              config.snapMinutes,
            ).end / 60,
          )}
          :
          {String(
            getCreationRange(
              creationBlock.start,
              creationBlock.end,
              config.snapMinutes,
            ).end % 60,
          ).padStart(2, "0")}
        </span>
      </div>
    {/if}

    <div class="blocks">
      {#each timelineState.blocks as block (block.id)}
        <TimelineBlock {block} {interactions} />
      {/each}
    </div>
  {/if}
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

    z-index: 4;
  }
</style>
