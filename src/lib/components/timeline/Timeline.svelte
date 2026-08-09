<script lang="ts">
  import TimelineGrid from "@components/timeline/TimelineGrid.svelte";

  import { getRanges } from "@db/ranges";
  import { getCurrentUser } from "@lib/db/auth";

  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  const config: TimelineConfig = {
    dayStart: 600,
    dayEnd: 1440,
    snapMinutes: 15,
    pixelsPerHour: 80,
  };

  let blocks: TimeBlock[] = $state([]);

  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadRanges() {
    loading = true;
    error = null;

    try {
      const user = getCurrentUser();

      if (!user) {
        throw new Error("You must be signed in to load your timeline.");
      }

      const ranges = await getRanges(user.id);

      blocks = ranges.map((range) => ({
        id: range.id,
        start: timeStringToMinutes(range.start),
        end: timeStringToMinutes(range.end),
        color: range.color,
        label: range.label,
      }));
    } catch (err) {
      console.error("Failed to load timeline ranges:", err);

      error =
        err instanceof Error ? err.message : "Failed to load timeline ranges.";
    } finally {
      loading = false;
    }
  }

  /**
   * Convert a database time value such as "10:30:00"
   * into minutes since midnight.
   */
  function timeStringToMinutes(timestamp: string): number {
    const date = new Date(timestamp);

    return date.getHours() * 60 + date.getMinutes();
  }

  loadRanges();
</script>

<div class="timeline">
  {#if loading}
    <div class="status">Loading...</div>
  {:else if error}
    <div class="status error">
      {error}
    </div>
  {:else}
    <TimelineGrid {config} {blocks} />
  {/if}
</div>

<style>
  .timeline {
    max-width: 300px;
    width: 100%;
    min-height: 600px;
    height: 100%;
    overflow-y: auto;
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
