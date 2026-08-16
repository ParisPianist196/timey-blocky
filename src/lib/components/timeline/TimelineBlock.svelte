<script lang="ts">
  import { contrastText } from "@lib/colors";
  import {
    removeBlock,
    updateBlockTitle,
  } from "@lib/stores/timelineBlocks.svelte";

  import { TimelineInteractions } from "@lib/interactions/TimelineInteractions";
  import type { TimeBlock } from "@timeline/types";
  import { tick } from "svelte";
  import { UpdateBlockInteraction } from "@lib/interactions/UpdateBlockInteractions";

  interface Props {
    block: TimeBlock;
    interactions: TimelineInteractions;
  }

  let { block, interactions }: Props = $props();

  let titleElement = $state<HTMLElement | null>(null);
  let title = $derived(block.label);
  let editingTitle = $state(false);
  const textColor = $derived(contrastText(block.color));

  let updateInteractions = $derived(
    new UpdateBlockInteraction(block, interactions),
  );

  const visualTop = $derived(
    updateInteractions.localBlock
      ? ((updateInteractions.localBlock.start - interactions.config.dayStart) /
          60) *
          interactions.config.pixelsPerHour
      : 0,
  );

  const visualHeight = $derived(
    updateInteractions.localBlock
      ? ((updateInteractions.localBlock.end -
          updateInteractions.localBlock.start) /
          60) *
          interactions.config.pixelsPerHour
      : 0,
  );

  function handleDelete(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    removeBlock(block.id);
  }

  async function handleEditTitle() {
    editingTitle = true;
    await tick();
    titleElement?.focus();
  }

  function commitTitle() {
    editingTitle = false;
    updateBlockTitle(block.id, title);
  }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTitle();

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      editingTitle = false;
      title = block.label;
    }
  }
</script>

<div
  class="block-wrapper"
  data-timeline-block
  style:top={`${visualTop}px`}
  style:height={`${visualHeight}px`}
>
  {#if editingTitle}
    <div
      class="block editing"
      style:background-color={block.color}
      style:color={textColor}
    >
      <input
        bind:this={titleElement}
        class="title-input"
        type="text"
        bind:value={title}
        placeholder="What are you doing?"
        aria-label="Time block title"
        onkeydown={handleKeydown}
        onblur={commitTitle}
      />
    </div>
  {:else}
    <div class="actions">
      <button
        class="action-button edit-button"
        type="button"
        aria-label={`Edit ${block.label || "time block"}`}
        onclick={handleEditTitle}
      >
        ✎
      </button>

      <button
        class="action-button delete-button"
        type="button"
        aria-label={`Delete ${block.label || "time block"}`}
        onclick={handleDelete}
      >
        ×
      </button>
    </div>

    <!--
      Main block button.

      This button owns the move interaction and
      therefore owns pointer capture.
    -->
    <button
      class="block block-button"
      type="button"
      style:background-color={block.color}
      style:color={textColor}
      aria-label={`Move ${block.label || "time block"}`}
      onpointerdown={(e) => updateInteractions.pointerStartAction(e)}
      onpointermove={(e) => updateInteractions.pointerMoveAction(e)}
      onpointerup={(e) => updateInteractions.pointerEndAction(e)}
      // onpointercancel={handlePointerCancel}
    >
      <span class="label">
        {block.label}
      </span>
    </button>

    <!-- Top resize handle -->
    <button
      class="resize-handle resize-handle-start"
      type="button"
      aria-label={`Resize start of ${block.label || "time block"}`}
      onpointerdown={(e) => updateInteractions.pointerStartAction(e)}
      onpointermove={(e) => updateInteractions.resizeAction(e, "start")}
      onpointerup={(e) => updateInteractions.pointerEndAction(e)}
      // onpointercancel={handlePointerCancel}
    >
      <span class="handle-grip"></span>
    </button>

    <!-- Bottom resize handle -->
    <button
      class="resize-handle resize-handle-end"
      type="button"
      aria-label={`Resize end of ${block.label || "time block"}`}
      onpointerdown={(e) => updateInteractions.pointerStartAction(e)}
      onpointermove={(e) => updateInteractions.resizeAction(e, "end")}
      onpointerup={(e) => updateInteractions.pointerEndAction(e)}
      // onpointercancel={handlePointerCancel}
    >
      <span class="handle-grip"></span>
    </button>
  {/if}
</div>

<style>
  .block-wrapper {
    position: absolute;

    left: 48px;
    right: 0;

    pointer-events: none;
  }

  .block-button {
    position: absolute;

    inset: 0;

    width: 100%;
    height: 100%;

    box-sizing: border-box;

    margin: 0;
    padding: 8px 12px;

    border: 0;
    border-radius: 8px;

    font: inherit;
    font-weight: 500;

    text-align: left;

    cursor: grab;

    pointer-events: auto;

    touch-action: none;

    transition: filter 120ms ease;
  }

  .block-button:hover {
    filter: brightness(1.05);
  }

  .block-button:active {
    cursor: grabbing;
  }

  .block-button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .label {
    display: block;

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;

    pointer-events: none;
  }

  .editing {
    position: absolute;

    inset: 0;

    box-sizing: border-box;

    padding: 8px 12px;

    border-radius: 8px;

    font-weight: 500;

    pointer-events: auto;

    touch-action: auto;
  }

  .title-input {
    width: 100%;

    box-sizing: border-box;

    padding: 6px 8px;

    border: 1px solid rgb(255 255 255 / 0.7);

    border-radius: 4px;

    background: rgb(255 255 255 / 0.9);

    color: #111827;

    font: inherit;

    outline: none;
  }

  .title-input:focus {
    border-color: white;
  }

  .resize-handle {
    position: absolute;

    left: 0;
    right: 0;

    width: 100%;
    height: 14px;

    margin: 0;
    padding: 0;

    border: 0;

    appearance: none;

    background: transparent;

    cursor: ns-resize;

    pointer-events: auto;

    touch-action: none;

    opacity: 0;

    z-index: 10;
  }

  .block-wrapper:hover .resize-handle {
    opacity: 1;
  }

  .resize-handle-start {
    top: -7px;
  }

  .resize-handle-end {
    bottom: -7px;
  }

  .handle-grip {
    display: block;

    position: absolute;

    left: 50%;
    top: 50%;

    width: 32px;
    height: 4px;

    transform: translate(-50%, -50%);

    border-radius: 999px;

    background: currentColor;

    box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  }

  .resize-handle:hover .handle-grip {
    width: 40px;
  }

  .actions {
    position: absolute;

    top: 4px;
    right: 4px;

    display: flex;
    gap: 2px;

    z-index: 20;

    pointer-events: auto;
  }

  .action-button {
    display: flex;

    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;

    padding: 0;

    border: 0;
    border-radius: 5px;

    background: rgb(255 255 255 / 0.2);
    color: inherit;

    font-size: 15px;

    cursor: pointer;

    transition:
      background-color 100ms ease,
      transform 100ms ease;
  }

  .action-button:hover {
    background: rgb(255 255 255 / 0.4);
  }

  .action-button:active {
    transform: scale(0.92);
  }

  .delete-button {
    font-size: 19px;
  }
</style>
