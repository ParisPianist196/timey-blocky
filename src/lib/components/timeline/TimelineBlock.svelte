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
   * Determine the best text color for the block's
   * background color.
   */
  const textColor = $derived(contrastText(block.color));

  /**
   * Focus the title input whenever a newly-created
   * block enters editing mode.
   */
  $effect(() => {
    if (editing) {
      title = block.label;
      finished = false;

      requestAnimationFrame(() => {
        titleInput?.focus();
        titleInput?.select();
      });
    }
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
   * Cancel creation of the block.
   */
  function cancelTitle() {
    if (finished) {
      return;
    }

    finished = true;

    oncancel?.();
  }

  /**
   * Handle keyboard interaction while editing.
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
   * Begin resizing the start of the block.
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
   * Begin resizing the end of the block.
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
      The block itself is a native button because it
      represents the primary interactive surface for
      moving the block.
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
   * The actual interactive block.
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

    transition:
      filter 120ms ease,
      transform 120ms ease;
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
  }

  /*
   * Editing isn't interactive as a draggable block.
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

  /*
   * Resize handles sit above the block button.
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

    z-index: 10;

    touch-action: none;
  }

  .resize-handle-start {
    top: 0;
  }

  .resize-handle-end {
    bottom: 0;
  }

  .handle-grip {
    position: absolute;

    left: 50%;

    width: 36px;
    height: 4px;

    transform: translateX(-50%);

    border-radius: 999px;

    background: currentColor;

    opacity: 0.35;

    transition:
      opacity 120ms ease,
      width 120ms ease;
  }

  .resize-handle-start .handle-grip {
    top: 4px;
  }

  .resize-handle-end .handle-grip {
    bottom: 4px;
  }

  .resize-handle:hover .handle-grip,
  .resize-handle.visible .handle-grip,
  .resize-handle:focus-visible .handle-grip {
    width: 48px;
    opacity: 1;
  }

  .resize-handle:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -2px;
  }

  .title-input {
    display: block;

    width: 100%;

    margin: 0;
    padding: 0;

    border: 0;
    outline: none;

    background: transparent;

    color: inherit;

    font: inherit;
    font-weight: 500;

    cursor: text;

    touch-action: auto;
  }

  .title-input::placeholder {
    color: currentColor;
    opacity: 0.65;
  }
</style>
