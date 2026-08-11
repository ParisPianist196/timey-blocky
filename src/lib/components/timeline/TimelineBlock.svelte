<script lang="ts">
  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  interface Props {
    block: TimeBlock;
    config: TimelineConfig;
    top: number;
    height: number;
    editing?: boolean;

    onpointerdown?: (event: PointerEvent) => void;
    onpointermove?: (event: PointerEvent) => void;
    onpointerup?: (event: PointerEvent) => void;
    onpointercancel?: (event: PointerEvent) => void;

    onresizestart?: (event: PointerEvent) => void;
    onresizeend?: (event: PointerEvent) => void;
    onresizepointermove?: (event: PointerEvent) => void;
    onresizepointerup?: (event: PointerEvent) => void;
    onresizepointercancel?: (event: PointerEvent) => void;

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
    onpointermove,
    onpointerup,
    onpointercancel,

    onresizestart,
    onresizeend,
    onresizepointermove,
    onresizepointerup,
    onresizepointercancel,

    ontitlechange,
    oncancel,
  }: Props = $props();

  let titleInput = $state<HTMLInputElement | null>(null);
  let title = $state(block.label);
  let finished = $state(false);

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

    event.stopPropagation();
    onresizestart?.(event);
  }

  function handleResizeEnd(event: PointerEvent) {
    if (editing) {
      return;
    }

    event.stopPropagation();
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
  {onpointermove}
  {onpointerup}
  {onpointercancel}
>
  {#if !editing}
    <button
      class="resize-handle resize-handle-start"
      type="button"
      aria-label={`Resize start of ${block.label || "time block"}`}
      onpointerdown={handleResizeStart}
      onpointermove={onresizepointermove}
      onpointerup={onresizepointerup}
      onpointercancel={onresizepointercancel}
    ></button>

    <button
      class="resize-handle resize-handle-end"
      type="button"
      aria-label={`Resize end of ${block.label || "time block"}`}
      onpointerdown={handleResizeEnd}
      onpointermove={onresizepointermove}
      onpointerup={onresizepointerup}
      onpointercancel={onresizepointercancel}
    ></button>
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

  .resize-handle {
    position: absolute;
    left: 0;
    right: 0;

    width: 100%;

    margin: 0;
    padding: 0;

    border: 0;

    background: transparent;

    cursor: ns-resize;

    z-index: 2;

    touch-action: none;
  }

  .resize-handle-start {
    top: -5px;
    height: 10px;
  }

  .resize-handle-end {
    bottom: -5px;
    height: 10px;
  }

  .resize-handle::after {
    content: "";

    position: absolute;
    left: 50%;

    width: 32px;
    height: 3px;

    transform: translateX(-50%);

    border-radius: 999px;

    background: rgb(255 255 255 / 0.65);

    opacity: 0;

    transition: opacity 120ms ease;
  }

  .resize-handle-start::after {
    top: 3px;
  }

  .resize-handle-end::after {
    bottom: 3px;
  }

  .resize-handle:hover::after,
  .resize-handle:focus-visible::after {
    opacity: 1;
  }

  .resize-handle:focus-visible {
    outline: 2px solid white;
    outline-offset: 1px;
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
