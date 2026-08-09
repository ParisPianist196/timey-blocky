<script lang="ts">
  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  interface Props {
    block: TimeBlock;
    config: TimelineConfig;
    active?: boolean;

    onPointerDown?: (event: PointerEvent, block: TimeBlock) => void;
    onResizeStart?: (
      event: PointerEvent,
      block: TimeBlock,
      edge: "start" | "end",
    ) => void;
  }

  let {
    block,
    config,
    active = false,
    onPointerDown,
    onResizeStart,
  }: Props = $props();

  const durationMinutes = $derived(block.end - block.start);

  const height = $derived((durationMinutes / 60) * config.pixelsPerHour);

  const RESIZE_HANDLE_HEIGHT = 8;

  function handlePointerDown(event: PointerEvent) {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    const pointerY = event.clientY - rect.top;

    if (pointerY <= RESIZE_HANDLE_HEIGHT) {
      onResizeStart?.(event, block, "start");
      return;
    }

    if (pointerY >= rect.height - RESIZE_HANDLE_HEIGHT) {
      onResizeStart?.(event, block, "end");
      return;
    }

    onPointerDown?.(event, block);
  }
</script>

<button
  type="button"
  class:active
  class="block"
  style="
    height: {height}px;
    background-color: {block.color};
  "
  aria-label={block.label || "Time block"}
  aria-pressed={active}
  onpointerdown={handlePointerDown}
>
  <div class="resize-hint top" aria-hidden="true"></div>

  <div class="content">
    {#if block.label}
      <span class="label">
        {block.label}
      </span>
    {/if}
  </div>

  <div class="resize-hint bottom" aria-hidden="true"></div>
</button>

<style>
  .block {
    position: relative;

    display: block;

    width: 100%;
    min-height: 4px;

    padding: 0;

    border: 0;
    border-radius: 0.5rem;

    box-sizing: border-box;

    overflow: hidden;

    cursor: grab;

    font: inherit;
    text-align: left;

    user-select: none;

    transition:
      box-shadow 100ms ease,
      filter 100ms ease;
  }

  .block:hover {
    filter: brightness(1.05);
  }

  .block:active {
    cursor: grabbing;
  }

  .block:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }

  .block.active {
    box-shadow:
      0 0 0 2px white,
      0 0 0 4px rgba(0, 0, 0, 0.25);
  }

  .content {
    position: absolute;
    inset: 0;

    display: flex;
    align-items: flex-start;

    padding: 0.4rem 0.6rem;

    pointer-events: none;
  }

  .label {
    font-size: 0.85rem;
    font-weight: 600;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .resize-hint {
    position: absolute;

    left: 0;
    right: 0;

    height: 8px;

    z-index: 2;

    pointer-events: none;
  }

  .resize-hint.top {
    top: 0;
  }

  .resize-hint.bottom {
    bottom: 0;
  }

  .block:hover .resize-hint {
    background: rgba(255, 255, 255, 0.15);
  }

  .block:hover {
    cursor: grab;
  }

  .block:hover .resize-hint.top,
  .block:hover .resize-hint.bottom {
    cursor: ns-resize;
  }
</style>
