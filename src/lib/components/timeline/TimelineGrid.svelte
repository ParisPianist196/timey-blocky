<script lang="ts">
  import type { TimeBlock, TimelineConfig } from "@timeline/types";
  import TimelineBlock from "./TimelineBlock.svelte";

  interface Props {
    config: TimelineConfig;
    blocks: TimeBlock[];
  }

  let { config, blocks }: Props = $props();

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const totalHeight = $derived((totalMinutes / 60) * config.pixelsPerHour);

  const hourCount = $derived(Math.ceil((config.dayEnd - config.dayStart) / 60));

  function hourTop(index: number): number {
    return index * config.pixelsPerHour;
  }

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
</script>

<div class="grid" style:height={`${totalHeight}px`}>
  <!-- Time blocks -->
  <div class="blocks" aria-hidden="true">
    {#each blocks as block (block.id)}
      <TimelineBlock
        {block}
        {config}
        top={blockTop(block)}
        height={blockHeight(block)}
      />
    {/each}
  </div>
</div>

<style>
  .grid {
    position: relative;
    height: 100%;
  }

  .blocks {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
</style>
