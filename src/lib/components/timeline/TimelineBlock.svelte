<script lang="ts">
  import { contrastText } from "@lib/colors";

  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  interface Props {
    block: TimeBlock;
    config: TimelineConfig;

    top: number;
    height: number;

    editing?: boolean;

    onpointerdown?: (event: PointerEvent) => void;

    onresizestart?: (event: PointerEvent) => void;

    onresizeend?: (event: PointerEvent) => void;

    ontitlechange?: (title: string) => void;

    oncancel?: () => void;
  }

  let {
    block,
    config,
    top,
    height,

    editing = false,

    onpointerdown,
    onresizestart,
    onresizeend,

    ontitlechange,
    oncancel,
  }: Props = $props();

  let titleInput = $state<HTMLInputElement | null>(null);

  let title = $state(block.label);

  let finished = $state(false);

  let hoveredResizeHandle = $state<"start" | "end" | null>(null);

  /**
   * Determine the best text color
   * for the block background.
   */
  const textColor = $derived(contrastText(block.color));

  /**
   * Focus the title input whenever
   * the block enters editing mode.
   */
  $effect(() => {
    if (!editing) {
      return;
    }

    title = block.label;
    finished = false;

    requestAnimationFrame(() => {
      titleInput?.focus();
      titleInput?.select();
    });
  });

  /**
   * Save the block title.
   */
  function commitTitle() {
    if (finished) {
      return;
    }

    finished = true;

    ontitlechange?.(title.trim());
  }

  /**
   * Cancel block creation.
   */
  function cancelTitle() {
    if (finished) {
      return;
    }

    finished = true;

    oncancel?.();
  }

  /**
   * Handle keyboard interaction
   * while editing.
   */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();

      commitTitle();

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      cancelTitle();
    }
  }

  /**
   * Begin moving the block.
   */
  function handlePointerDown(event: PointerEvent) {
    if (editing) {
      return;
    }

    onpointerdown?.(event);
  }

  /**
   * Begin resizing the start.
   */
  function handleResizeStart(event: PointerEvent) {
    if (editing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    hoveredResizeHandle = "start";

    onresizestart?.(event);
  }

  /**
   * Begin resizing the end.
   */
  function handleResizeEnd(event: PointerEvent) {
    if (editing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    hoveredResizeHandle = "end";

    onresizeend?.(event);
  }
</script>

<div
  class="block-wrapper"
  data-timeline-block
  style:top={`${top}px`}
  style:height={`${height}px`}
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
    <!--
      Main block interaction.

      Native button:
      - move
      - focus
      - keyboard accessibility
    -->
    <button
      class="block block-button"
      type="button"
      style:background-color={block.color}
      style:color={textColor}
      aria-label={`Move ${block.label || "time block"}`}
      onpointerdown={handlePointerDown}
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
      onpointerdown={handleResizeStart}
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
      onpointerdown={handleResizeEnd}
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

  /*
   * Main draggable block.
   */
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

    /*
     * Don't animate position/background while dragging.
     *
     * This is important for responsiveness.
     */
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
    pointer-events: none;

    display: block;

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;
  }

  /*
   * Editing state.
   */
  .block.editing {
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

  /*
   * Resize handles sit above
   * the block button.
   */
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
</style>
