<script lang="ts">
  import TimelineGrid from "@components/timeline/TimelineGrid.svelte";
  import TimelineRuler from "@components/timeline/TimelineRuler.svelte";

  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  const config: TimelineConfig = {
    dayStart: 600,
    dayEnd: 1440,
    snapMinutes: 15,
    pixelsPerHour: 80,
  };

  let blocks: TimeBlock[] = [];
</script>

<div class="timeline">
  <div class="timeline-ruler">
    <TimelineRuler {config} />
  </div>

  <div class="timeline-grid">
    <TimelineGrid {config} {blocks} />
  </div>
</div>

<style>
  .timeline {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .timeline-ruler {
    position: relative;
    flex: 0 0 4rem;
    height: 100%;
  }

  .timeline-grid {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 100%;
  }
</style>
