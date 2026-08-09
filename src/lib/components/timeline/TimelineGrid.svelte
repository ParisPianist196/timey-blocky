<script lang="ts">
  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  interface Props {
    config: TimelineConfig;
    blocks: TimeBlock[];
  }

  let { config, blocks }: Props = $props();

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  const hourCount = $derived(Math.ceil(totalMinutes / 60));

  function hourTop(index: number) {
    return index * config.pixelsPerHour;
  }

  function formatHour(minutes: number) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return minute === 0
      ? `${displayHour} ${suffix}`
      : `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
  }
</script>

<div class="grid" style:height={totalHeight}>
  <!-- Visual grid lines -->
  <div class="grid-lines" aria-hidden="true">
    {#each Array(hourCount + 1) as _, index}
      {@const minutes = config.dayStart + index * 60}

      <div class="hour-line" style:top={hourTop(index)}>
        <span class="hour-label">
          {formatHour(minutes)}
        </span>
      </div>

      {#if index < hourCount}
        <div
          class="half-hour-line"
          style:top={hourTop(index) + config.pixelsPerHour / 2}
        ></div>
      {/if}
    {/each}
  </div>

  <!-- Time blocks -->
  <div class="blocks" aria-hidden="true">
    {#each blocks as block (block.id)}
      <div
        class="block-wrapper"
        style="
          top: {((block.start - config.dayStart) / 60) *
          config.pixelsPerHour}px;
          height: {((block.end - block.start) / 60) * config.pixelsPerHour}px;
        "
      ></div>
    {/each}
  </div>
</div>

<style>
  .grid {
    position: relative;
    width: 100%;
    user-select: none;
  }

  .grid-lines {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .hour-line,
  .half-hour-line {
    position: absolute;
    left: 0;
    width: 100%;
  }

  .hour-line {
    border-top: 1px solid var(--timeline-hour-line, #d4d4d8);
  }

  .half-hour-line {
    border-top: 1px dashed var(--timeline-half-hour-line, #e4e4e7);
  }

  .hour-label {
    position: absolute;
    left: 0.75rem;
    top: -0.7rem;

    font-size: 0.75rem;
    color: var(--timeline-label, #71717a);

    white-space: nowrap;
  }

  .blocks {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .block-wrapper {
    position: absolute;
    left: 4.5rem;
    right: 0.75rem;
  }
</style>
