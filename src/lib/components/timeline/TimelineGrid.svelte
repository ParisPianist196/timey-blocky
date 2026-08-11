<script lang="ts">
  import type { DragSelection } from "@timeline/interactions";
  import { getCreationRange, pixelsToMinutes } from "@timeline/interactions";
  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  import TimelineBlock from "./TimelineBlock.svelte";

  interface Props {
    config: TimelineConfig;
    blocks: TimeBlock[];
    oncreateblock?: (range: DragSelection) => void;
  }

  let { config, blocks, oncreateblock }: Props = $props();

  const totalMinutes = $derived(config.dayEnd - config.dayStart);
  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  let isCreating = $state(false);
  let creationStartMinutes = $state(0);
  let creationCurrentMinutes = $state(0);

  function blockTop(block: TimeBlock): number {
    return ((block.start - config.dayStart) / 60) * config.pixelsPerHour;
  }

  function blockHeight(block: TimeBlock): number {
    return ((block.end - block.start) / 60) * config.pixelsPerHour;
  }

  function formatHour(minutes: number): string {
    const hours24 = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;

    if (hours24 === 24) {
      return "12 AM";
    }

    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    if (minutesPart === 0) {
      return `${hours12} ${period}`;
    }

    return `${hours12}:${minutesPart.toString().padStart(2, "0")} ${period}`;
  }

  /**
   * Convert a pointer's client Y coordinate into timeline minutes.
   */
  function pointerToMinutes(event: PointerEvent): number {
    const surface = event.currentTarget as HTMLElement;
    const rect = surface.getBoundingClientRect();

    const pixels = event.clientY - rect.top;

    const minutes = pixelsToMinutes(
      pixels,
      config.dayStart,
      config.pixelsPerHour,
    );

    return Math.max(config.dayStart, Math.min(minutes, config.dayEnd));
  }

  function handlePointerDown(event: PointerEvent) {
    // Only start creation with the primary mouse button.
    if (event.button !== 0) {
      return;
    }

    const minutes = pointerToMinutes(event);

    isCreating = true;
    creationStartMinutes = minutes;
    creationCurrentMinutes = minutes;

    const surface = event.currentTarget as HTMLElement;

    surface.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isCreating) {
      return;
    }

    creationCurrentMinutes = pointerToMinutes(event);
  }

  function handlePointerUp(event: PointerEvent) {
    if (!isCreating) {
      return;
    }

    const surface = event.currentTarget as HTMLElement;

    const range = getCreationRange(
      creationStartMinutes,
      creationCurrentMinutes,
      config.snapMinutes,
    );

    isCreating = false;

    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
    }

    // Don't create a zero-length block.
    if (range.start === range.end) {
      return;
    }

    oncreateblock?.(range);
  }

  function handlePointerCancel(event: PointerEvent) {
    if (!isCreating) {
      return;
    }

    const surface = event.currentTarget as HTMLElement;

    isCreating = false;

    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
    }
  }

  const creationRange = $derived.by(() => {
    if (!isCreating) {
      return null;
    }

    return getCreationRange(
      creationStartMinutes,
      creationCurrentMinutes,
      config.snapMinutes,
    );
  });

  const creationTop = $derived(
    creationRange
      ? blockTop({
          id: "__creation__",
          start: creationRange.start,
          end: creationRange.end,
          color: "",
          label: "",
        })
      : 0,
  );

  const creationHeight = $derived(
    creationRange
      ? blockHeight({
          id: "__creation__",
          start: creationRange.start,
          end: creationRange.end,
          color: "",
          label: "",
        })
      : 0,
  );
</script>

<div class="grid" style:height={`${totalHeight}px`}>
  <!--
    Interactive creation surface.

    This is a real button so the timeline's creation interaction
    has native interactive semantics rather than putting pointer
    handlers on a static div.
  -->
  <button
    class="creation-surface"
    type="button"
    aria-label="Create a time block"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerCancel}
  ></button>

  <!-- Time blocks -->
  <div class="blocks">
    {#each blocks as block (block.id)}
      <TimelineBlock
        {block}
        {config}
        top={blockTop(block)}
        height={blockHeight(block)}
      />
    {/each}

    {#if creationRange && creationHeight > 0}
      <div
        class="creation-preview"
        style:top={`${creationTop}px`}
        style:height={`${creationHeight}px`}
      >
        <span>
          {formatHour(creationRange.start)}
          –
          {formatHour(creationRange.end)}
        </span>
      </div>
    {/if}
  </div>
</div>

<style>
  .grid {
    position: relative;
    height: 100%;

    user-select: none;
  }

  .creation-surface {
    position: absolute;
    inset: 0;

    width: 100%;
    height: 100%;

    margin: 0;
    padding: 0;

    border: 0;
    border-radius: 0;

    background: transparent;

    cursor: crosshair;

    touch-action: none;
  }

  .blocks {
    position: absolute;
    inset: 0;

    pointer-events: none;
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
  }
</style>
