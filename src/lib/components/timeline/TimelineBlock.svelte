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

  let title = $state(block.label);
  let titleInput = $state<HTMLInputElement | null>(null);

  let hoveredResizeHandle = $state<"start" | "end" | null>(null);

  $effect(() => {
    if (editing && titleInput) {
      titleInput.focus();
      titleInput.select();
    }
  });

  $effect(() => {
    if (!editing) {
      title = block.label;
    }
  });

  function commitTitle() {
    ontitlechange?.(title.trim());
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTitle();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      oncancel?.();
    }
  }

  function handleBlockPointerDown(event: PointerEvent) {
    if (editing) {
      return;
    }

    onpointerdown?.(event);
  }

  function handleResizeStartPointerDown(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    onresizestart?.(event);
  }

  function handleResizeEndPointerDown(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    onresizeend?.(event);
  }
</script>

<div
  class="block-container"
  data-timeline-block
  style:top={`${top}px`}
  style:height={`${height}px`}
>
  <!-- Main movable block -->
  <button
    class="block"
    class:editing
    type="button"
    aria-label={block.label || "Time block"}
    disabled={editing}
    onpointerdown={handleBlockPointerDown}
  >
    {#if editing}
      <input
        bind:this={titleInput}
        class="title-input"
        type="text"
        bind:value={title}
        placeholder="What are you doing?"
        aria-label="Time block title"
        onpointerdown={(event) => event.stopPropagation()}
        onkeydown={handleKeydown}
        onblur={commitTitle}
      />
    {:else}
      <span class="label">
        {block.label}
      </span>
    {/if}
  </button>

  {#if !editing}
    <!-- Start resize handle -->
    <button
      class:visible={hoveredResizeHandle === "start"}
      class="resize-handle resize-handle-start"
      type="button"
      aria-label={`Resize start of ${block.label || "time block"}`}
      onpointerdown={handleResizeStartPointerDown}
      onpointerenter={() => (hoveredResizeHandle = "start")}
      onpointerleave={() => (hoveredResizeHandle = null)}
    >
      <span class="handle-grip"></span>
    </button>

    <!-- End resize handle -->
    <button
      class:visible={hoveredResizeHandle === "end"}
      class="resize-handle resize-handle-end"
      type="button"
      aria-label={`Resize end of ${block.label || "time block"}`}
      onpointerdown={handleResizeEndPointerDown}
      onpointerenter={() => (hoveredResizeHandle = "end")}
      onpointerleave={() => (hoveredResizeHandle = null)}
    >
      <span class="handle-grip"></span>
    </button>
  {/if}
</div>

<style>
  .block-container {
    position: absolute;

    left: 48px;
    right: 0;

    overflow: visible;

    pointer-events: none;
  }

  .block {
    position: absolute;

    inset: 0;

    width: 100%;
    height: 100%;

    box-sizing: border-box;

    border: 0;
    border-radius: 8px;

    padding: 8px 10px;

    background: inherit;

    color: var(--block-text-color, white);

    text-align: left;

    cursor: grab;

    user-select: none;

    touch-action: none;

    pointer-events: auto;

    transition:
      box-shadow 100ms ease,
      transform 100ms ease;
  }

  .block:hover {
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.15);
  }

  .block:active {
    cursor: grabbing;
  }

  .block:disabled {
    cursor: default;
  }

  .label {
    display: block;

    overflow: hidden;

    text-overflow: ellipsis;
    white-space: nowrap;

    font-size: 12px;
    font-weight: 600;
  }

  .title-input {
    display: block;

    width: 100%;

    box-sizing: border-box;

    border: 1px solid rgb(255 255 255 / 0.7);
    border-radius: 4px;

    padding: 4px 6px;

    background: rgb(255 255 255 / 0.9);

    color: #111827;

    font: inherit;
    font-size: 12px;

    outline: none;

    pointer-events: auto;
  }

  .title-input:focus {
    border-color: white;
  }

  .resize-handle {
    position: absolute;

    left: 50%;

    width: 56px;
    height: 14px;

    padding: 0;

    border: 0;
    border-radius: 6px;

    transform: translateX(-50%);

    background: transparent;

    cursor: ns-resize;

    opacity: 0;

    z-index: 10;

    pointer-events: auto;

    touch-action: none;
  }

  .block-container:hover .resize-handle,
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

    border-radius: 999px;

    transform: translate(-50%, -50%);

    background: rgb(255 255 255 / 0.9);

    box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  }

  .resize-handle:hover .handle-grip {
    width: 40px;
  }
</style>
