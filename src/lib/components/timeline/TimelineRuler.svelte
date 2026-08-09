<script lang="ts">
  import type { TimelineConfig } from "@timeline/types";

  interface Props {
    config: TimelineConfig;
  }

  let { config }: Props = $props();

  const totalMinutes = $derived(config.dayEnd - config.dayStart);

  const hourCount = $derived(Math.ceil(totalMinutes / 60));

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

<div class="ruler">
  {#each Array(hourCount + 1) as _, index}
    {@const minutes = config.dayStart + index * 60}

    <div class="ruler-mark" style:top={`${index * config.pixelsPerHour}px`}>
      <span>{formatHour(minutes)}</span>
    </div>
  {/each}
</div>

<style>
  .ruler {
    position: relative;
    width: 100%;
    height: 100%;
    user-select: none;
    pointer-events: none;
  }

  .ruler-mark {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    padding-right: 0.75rem;

    font-size: 0.75rem;
    color: var(--timeline-label, #71717a);

    white-space: nowrap;
  }
</style>
