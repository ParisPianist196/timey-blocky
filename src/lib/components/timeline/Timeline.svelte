<script lang="ts">
  import TimelineGrid from "@components/timeline/TimelineGrid.svelte";
  import type { TimelineConfig } from "@timeline/types";
  import TimelineRuler from "./TimelineRuler.svelte";
  import { loadBlocks, timelineState } from "@lib/stores/timelineBlocks.svelte";
  import { onMount } from "svelte";
  import { getCurrentUser } from "@lib/db/auth";

  const config: TimelineConfig = {
    dayStart: 600,
    dayEnd: 1440,
    snapMinutes: 15,
    pixelsPerHour: 80,
  };

  async function load() {
    const user = getCurrentUser();
    if (user && user.id) await loadBlocks(user.id);
    else throw Error("User not logged in");
  }
  onMount(load);
</script>

<div class="timeline">
  {#if timelineState.loading}
    <div class="status">Loading...</div>
  {:else if timelineState.error}
    <div class="status error">
      {timelineState.error}
    </div>
  {:else}
    <div class="wrapper">
      <TimelineRuler {config} />
      <TimelineGrid {config} />
    </div>
  {/if}
</div>

<style>
  .timeline {
    max-width: 300px;
    width: 100%;
    min-height: 600px;
    height: 100%;
    overflow-y: auto;
    padding: 12px;
  }

  .status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #71717a;
  }

  .status.error {
    color: #dc2626;
  }
</style>
