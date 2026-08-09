<script lang="ts">
  import TimelineGrid from "@components/timeline/TimelineGrid.svelte";
  import TimelineRuler from "@components/timeline/TimelineRuler.svelte";

  import { nhost } from "@db/client";
  import { getRanges } from "@db/ranges";

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
      const userData = await nhost.auth.getUser();
      const user = userData.body;

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
  function timeStringToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
  }

  loadRanges();
</script>

<div class="timeline">
  <div class="timeline-ruler">
    <TimelineRuler {config} />
  </div>

  <div class="timeline-grid">
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
