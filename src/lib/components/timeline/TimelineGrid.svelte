<script lang="ts">
  import { TimelineInteractions } from "@lib/interactions/TimelineInteractions";
  import { CreateBlockInteraction } from "@lib/interactions/CreateBlockInteraction";
  import type {
    TimelineConfig,
    TimelineViewport,
  } from "@lib/interactions/types";
  import { timelineState } from "@lib/stores/timelineBlocks.svelte";
  import TimelineBlock from "./TimelineBlock.svelte";

  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}:${String(mins).padStart(2, "0")}`;
  }

  interface Props {
    config: TimelineConfig;
  }

  let { config }: Props = $props();

  let gridElement = $state<HTMLElement | null>(null);
  let interactions = $state<TimelineInteractions>();
  let creationInteraction = $state<CreateBlockInteraction | null>(null);

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  function getViewport(): TimelineViewport {
    if (!gridElement) {
      throw new Error("Grid element is not initialized");
    }

    const rect = gridElement.getBoundingClientRect();

    return {
      top: rect.top,
      scrollTop: gridElement.scrollTop,
    };
  }

  $effect(() => {
    if (!gridElement) return;

    interactions = new TimelineInteractions(config, getViewport());
  });

  function updateViewport() {
    if (!interactions) return;

    interactions.viewport = getViewport();
  }

  function handleCreateBlock(event: PointerEvent) {
    if (!interactions) {
      throw new Error("Can't create block before interactions are initialized");
    }

    updateViewport();

    creationInteraction = new CreateBlockInteraction(interactions, event);
  }

  function handleCreateMove(event: PointerEvent) {
    if (!creationInteraction) return;

    updateViewport();
    creationInteraction.pointerMoveAction(event);
  }

  async function handleCreateEnd(event: PointerEvent) {
    if (!creationInteraction) return;

    updateViewport();

    await creationInteraction.pointerEndAction(event);
    creationInteraction = null;
  }

  function handleCreationPointerCancel(event: PointerEvent) {
    if (!creationInteraction) return;

    creationInteraction.pointerEndAction(event);
    creationInteraction = null;
  }
</script>

<div
  bind:this={gridElement}
  class="grid"
  style:height={`${totalHeight}px`}
  onscroll={updateViewport}
>
  {#if interactions}
    <!-- Creation surface -->
    <button
      class="creation-surface"
      type="button"
      aria-label="Create a time block"
      onpointerdown={handleCreateBlock}
      onpointermove={handleCreateMove}
      onpointerup={handleCreateEnd}
      onpointercancel={handleCreationPointerCancel}
    ></button>

    {#if creationInteraction?.localBlock}
      {@const block = creationInteraction.localBlock}

      {#if block.height && block.height > 0}
        <div
          class="creation-preview"
          style:top={`${block.top}px`}
          style:height={`${block.height}px`}
        >
          <span>
            {formatMinutes(block.start)}
            –
            {formatMinutes(block.end)}
          </span>
        </div>
      {/if}
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
