<script lang="ts">
  import { contrastText } from "@lib/colors";
  import {
    removeBlock,
    updateBlockTitle,
  } from "@lib/stores/timelineBlocks.svelte";

  import {
    getMovedBlockRange,
    getResizedEnd,
    getResizedStart,
  } from "@timeline/interactions";

  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  interface Props {
    block: TimeBlock;
    config: TimelineConfig;

    pointerToMinutes: (event: PointerEvent) => number;

    onrangechange?: (blockId: string, start: number, end: number) => void;
  }

  let {
    block,
    config,

    pointerToMinutes,

    onrangechange,
  }: Props = $props();

  /**
   * The block's temporary visual state.
   *
   * This is intentionally separate from `block`.
   *
   * `block` is the committed state from the store.
   * `localStart` / `localEnd` are only used while
   * the user is interacting with the block.
   */
  let localStart = $state<number | null>(null);
  let localEnd = $state<number | null>(null);

  /**
   * Which part of the block is currently being
   * manipulated.
   */
  let interaction = $state<
    "idle" | "moving" | "resizing-start" | "resizing-end"
  >("idle");

  /**
   * Data captured when the interaction begins.
   *
   * These values never change during the drag.
   */
  let originalStart = $state(0);
  let originalEnd = $state(0);
  let offsetMinutes = $state(0);

  /**
   * The pointer that started the interaction.
   */
  let pointerId = $state<number | null>(null);

  /**
   * The button that currently owns pointer capture.
   */
  let capturedElement = $state<HTMLButtonElement | null>(null);

  /**
   * Resize handle currently being hovered.
   */
  let hoveredResizeHandle = $state<"start" | "end" | null>(null);

  /**
   * Whether the block is currently being edited.
   *
   * Kept local for now; we can move this into a
   * dedicated editing state later.
   */
  let editing = $state(false);

  let titleInput = $state<HTMLInputElement | null>(null);

  let title = $derived(block.label);

  let finished = $state(false);

  const textColor = $derived(contrastText(block.color));

  /**
   * The visual start of the block.
   *
   * During an interaction we use the local value.
   * Otherwise we use the committed block value.
   */
  const visualStart = $derived(localStart ?? block.start);

  /**
   * The visual end of the block.
   */
  const visualEnd = $derived(localEnd ?? block.end);

  /**
   * Visual position of the block.
   */
  const visualTop = $derived(
    ((visualStart - config.dayStart) / 60) * config.pixelsPerHour,
  );

  /**
   * Visual height of the block.
   */
  const visualHeight = $derived(
    ((visualEnd - visualStart) / 60) * config.pixelsPerHour,
  );

  /**
   * Reset temporary interaction state.
   */
  function resetInteraction() {
    interaction = "idle";

    localStart = null;
    localEnd = null;

    originalStart = 0;
    originalEnd = 0;
    offsetMinutes = 0;

    pointerId = null;
    capturedElement = null;
  }

  /**
   * Capture the pointer on the native button that
   * actually started the interaction.
   */
  function capturePointer(event: PointerEvent) {
    const element = event.currentTarget as HTMLButtonElement;

    capturedElement = element;

    pointerId = event.pointerId;

    element.setPointerCapture(event.pointerId);
  }

  /**
   * Release pointer capture.
   */
  function releasePointer() {
    if (
      capturedElement &&
      pointerId !== null &&
      capturedElement.hasPointerCapture(pointerId)
    ) {
      capturedElement.releasePointerCapture(pointerId);
    }

    capturedElement = null;
    pointerId = null;
  }

  /**
   * Begin moving the block.
   */
  function handleMovePointerDown(event: PointerEvent) {
    if (event.button !== 0 || editing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentMinutes = pointerToMinutes(event);

    originalStart = block.start;
    originalEnd = block.end;

    offsetMinutes = currentMinutes - block.start;

    localStart = block.start;
    localEnd = block.end;

    interaction = "moving";

    capturePointer(event);
  }

  /**
   * Begin resizing the start of the block.
   */
  function handleResizeStartPointerDown(event: PointerEvent) {
    if (event.button !== 0 || editing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    originalStart = block.start;
    originalEnd = block.end;

    localStart = block.start;
    localEnd = block.end;

    interaction = "resizing-start";

    hoveredResizeHandle = "start";

    capturePointer(event);
  }

  /**
   * Begin resizing the end of the block.
   */
  function handleResizeEndPointerDown(event: PointerEvent) {
    if (event.button !== 0 || editing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    originalStart = block.start;
    originalEnd = block.end;

    localStart = block.start;
    localEnd = block.end;

    interaction = "resizing-end";

    hoveredResizeHandle = "end";

    capturePointer(event);
  }

  /**
   * Update the temporary visual state while dragging.
   *
   * IMPORTANT:
   *
   * We do NOT update the store here.
   *
   * This function only changes localStart/localEnd,
   * which makes dragging visually immediate.
   */
  function handlePointerMove(event: PointerEvent) {
    if (pointerId === null || event.pointerId !== pointerId) {
      return;
    }

    if (interaction === "idle") {
      return;
    }

    const currentMinutes = pointerToMinutes(event);

    if (interaction === "moving") {
      const range = getMovedBlockRange(
        {
          ...block,
          start: originalStart,
          end: originalEnd,
        },
        currentMinutes,
        offsetMinutes,
        config.dayStart,
        config.dayEnd,
        config.snapMinutes,
      );

      localStart = range.start;
      localEnd = range.end;

      return;
    }

    if (interaction === "resizing-start") {
      localStart = getResizedStart(
        originalEnd,
        currentMinutes,
        config.dayStart,
        config.snapMinutes,
      );

      localEnd = originalEnd;

      return;
    }

    if (interaction === "resizing-end") {
      localStart = originalStart;

      localEnd = getResizedEnd(
        originalStart,
        currentMinutes,
        config.dayEnd,
        config.snapMinutes,
      );
    }
  }

  /**
   * Persist the final range.
   *
   * This is the ONLY place where the interaction
   * talks to the store.
   */
  async function handlePointerUp(event: PointerEvent) {
    if (pointerId === null || event.pointerId !== pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const finalStart = localStart ?? block.start;

    const finalEnd = localEnd ?? block.end;

    const didChange = finalStart !== block.start || finalEnd !== block.end;

    const blockId = block.id;

    releasePointer();

    const wasInteracting = interaction !== "idle";

    resetInteraction();

    if (wasInteracting && didChange) {
      await onrangechange?.(blockId, finalStart, finalEnd);
    }
  }

  /**
   * Cancel the interaction without persisting.
   */
  function handlePointerCancel(event: PointerEvent) {
    if (pointerId === null || event.pointerId !== pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    releasePointer();

    resetInteraction();
  }

  /**
   * Begin editing the title.
   */
  function handleEdit(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    editing = true;
    title = block.label;
    finished = false;

    requestAnimationFrame(() => {
      titleInput?.focus();
      titleInput?.select();
    });
  }

  /**
   * Delete the block.
   *
   * We can wire this directly into the store once
   * we finish moving all block actions into this
   * component.
   */
  function handleDelete(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    removeBlock(block.id);
  }

  /**
   * Save the title.
   */
  function commitTitle() {
    if (finished) {
      return;
    }

    finished = true;
    editing = false;
    updateBlockTitle(block.id, title);
  }

  /**
   * Handle title editing keyboard shortcuts.
   */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTitle();

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      finished = true;
      editing = false;
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
  {#if editing}
    <div
      class="block editing"
      style:background-color={block.color}
      style:color={textColor}
    >
      <input
        bind:this={titleInput}
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
        onclick={handleEdit}
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
      onpointerdown={handleMovePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerCancel}
    >
      <span class="label">
        {block.label}
      </span>
    </button>

    <!-- Top resize handle -->
    <button
      class:visible={hoveredResizeHandle === "start"}
      class="resize-handle resize-handle-start"
      type="button"
      aria-label={`Resize start of ${block.label || "time block"}`}
      onpointerdown={handleResizeStartPointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerCancel}
      onpointerenter={() => (hoveredResizeHandle = "start")}
      onpointerleave={() => (hoveredResizeHandle = null)}
    >
      <span class="handle-grip"></span>
    </button>

    <!-- Bottom resize handle -->
    <button
      class:visible={hoveredResizeHandle === "end"}
      class="resize-handle resize-handle-end"
      type="button"
      aria-label={`Resize end of ${block.label || "time block"}`}
      onpointerdown={handleResizeEndPointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerCancel}
      onpointerenter={() => (hoveredResizeHandle = "end")}
      onpointerleave={() => (hoveredResizeHandle = null)}
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

  .block-wrapper:hover .resize-handle,
  .resize-handle.visible {
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
