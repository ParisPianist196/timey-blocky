<script lang="ts">
  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  interface Props {
    block: TimeBlock;
    config: TimelineConfig;
    top: number;
    height: number;
    editing?: boolean;
    ontitlechange?: (title: string) => void;
    oncancel?: () => void;
  }

  let {
    block,
    config,
    top,
    height,
    editing = false,
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

    const trimmedTitle = title.trim();

    ontitlechange?.(trimmedTitle);
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
</script>

<div
  class="block"
  data-timeline-block
  style:top={`${top}px`}
  style:height={`${height}px`}
  style:background-color={block.color}
>
  {#if editing}
    <input
      bind:this={titleInput}
      class="title-input"
      type="text"
      bind:value={title}
      placeholder="What's my name?"
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

    border-radius: 8px;

    padding: 8px 12px;

    box-sizing: border-box;

    pointer-events: auto;

    color: white;
  }

  .label {
    font-weight: 500;
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
  }

  .title-input::placeholder {
    color: currentColor;
    opacity: 0.7;
  }
</style>
