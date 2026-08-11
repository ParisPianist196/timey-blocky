<script lang="ts">
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

  function commitTitle() {
    if (finished) {
      return;
    }

    finished = true;

    ontitlechange?.(title.trim());
  }

  function cancelTitle() {
    if (finished) {
      return;
    }

    finished = true;

    oncancel?.();
  }

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

  function handlePointerDown(event: PointerEvent) {
    if (editing) {
      return;
    }

    onpointerdown?.(event);
  }

  function handleResizeStart(event: PointerEvent) {
    if (editing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    hoveredResizeHandle = "start";

    onresizestart?.(event);
  }

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
  class="block"
  data-timeline-block
  style:top={`${top}px`}
  style:height={`${height}px`}
  style:background-color={block.color}
  onpointerdown={handlePointerDown}
>
  {#if !editing}
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

  {#if editing}
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
  {:else}
    <span class="label">
      {block.label}
    </span>
  {/if}
</div>

<style>
  .block {
    position: absolute;

    left: 48px;
    right: 0;

    box-sizing: border-box;

    padding: 8px 12px;

    border-radius: 8px;

    pointer-events: auto;

    color: white;

    cursor: grab;

    touch-action: none;
  }

  .block:active {
    cursor: grabbing;
  }

  .label {
    font-weight: 500;
  }

  /*
   * The handles are deliberately inside the block.
   *
   * The visible grip is only 4px tall, but the actual
   * clickable area is 14px tall.
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

    background: white;

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
    outline: 2px solid white;
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
    opacity: 0.7;
  }
</style>
