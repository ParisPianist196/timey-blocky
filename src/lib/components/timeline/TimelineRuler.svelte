<script lang="ts">
  import type { TimelineConfig } from "@timeline/types";

  interface Props {
    config: TimelineConfig;
  }

  let { config }: Props = $props();

  const hourCount = $derived(Math.ceil((config.dayEnd - config.dayStart) / 60));

  function hourTop(index: number): number {
    return index * config.pixelsPerHour;
  }

  function minutesForHour(index: number): number {
    return config.dayStart + index * 60;
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

<div class="timeline-grid">
  <div class="timeline-ruler">
    {#each Array(hourCount + 1) as _, index}
      {@const minutes = minutesForHour(index)}

      <div class="hour-line" style:top={`${hourTop(index)}px`}>
        <span class="hour-label">
          {formatHour(minutes)}
        </span>
      </div>

      {#if index < hourCount}
        <div
          class="half-hour-line"
          style:top={`${hourTop(index) + config.pixelsPerHour / 2}px`}
        ></div>
      {/if}
    {/each}
  </div>

  <div class="timeline-content">
    <!-- Existing timeline blocks go here -->
  </div>
</div>

<style>
  .timeline-grid {
    position: relative;
    width: 100%;
  }

  .timeline-ruler {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .hour-line,
  .half-hour-line {
    position: absolute;
    left: 0;
    right: 0;
  }
  .hour-line {
    border-top: 1px solid #c98f82;
  }

  .half-hour-line {
    border-top: 1px solid #e2b8ad;
  }

  .hour-label {
    position: absolute;
    top: -12px;
    left: 0;
    font-size: 12px;
    line-height: 20px;
    white-space: nowrap;
    width: 40px;
    border-radius: 8px;
    background-color: white;
    text-align: center;
  }

  .timeline-content {
    position: relative;
    height: 100%;
  }
</style>
