<script lang="ts">
  import TimelineGrid from "@components/timeline/TimelineGrid.svelte";

  import { createRange, getRanges, updateRange } from "@db/ranges";

  import { getCurrentUser } from "@lib/db/auth";
  import { randomColor } from "@lib/colors";

  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  import TimelineRuler from "./TimelineRuler.svelte";

  const config: TimelineConfig = {
    dayStart: 600,
    dayEnd: 1440,
    snapMinutes: 15,
    pixelsPerHour: 80,
  };

  let blocks: TimeBlock[] = $state([]);

  let editingBlockId = $state<string | null>(null);

  let loading = $state(true);
  let error = $state<string | null>(null);

  /**
   * Load the user's existing timeline ranges.
   */
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
   * Convert a database timestamp into minutes
   * since midnight.
   */
  function timeStringToMinutes(timestamp: string): number {
    const date = new Date(timestamp);

    return date.getHours() * 60 + date.getMinutes();
  }

  /**
   * Convert timeline minutes into a database timestamp.
   */
  function minutesToTimestamp(minutes: number): string {
    const date = new Date();

    const hours = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;

    date.setHours(hours, minutesPart, 0, 0);

    return date.toISOString();
  }

  /**
   * Add a newly-created block locally.
   */
  function handleCreateBlock(range: { start: number; end: number }) {
    const block: TimeBlock = {
      id: crypto.randomUUID(),
      start: range.start,
      end: range.end,
      color: randomColor(),
      label: "",
    };

    blocks = [...blocks, block];

    editingBlockId = block.id;
  }

  /**
   * Save a newly-created block.
   */
  async function handleBlockTitleChange(blockId: string, title: string) {
    const block = blocks.find((candidate) => candidate.id === blockId);

    if (!block) {
      return;
    }

    if (!title) {
      handleCancelBlock(blockId);
      return;
    }

    const user = getCurrentUser();

    if (!user) {
      error = "You must be signed in to save a timeline block.";

      handleCancelBlock(blockId);

      return;
    }

    try {
      const range = await createRange({
        start: minutesToTimestamp(block.start),
        end: minutesToTimestamp(block.end),
        color: block.color,
        label: title,
        owner_id: user.id,
      });

      blocks = blocks.map((candidate) =>
        candidate.id === blockId
          ? {
              ...candidate,
              id: range.id,
              label: range.label,
            }
          : candidate,
      );

      editingBlockId = null;
    } catch (err) {
      console.error("Failed to create timeline range:", err);

      error =
        err instanceof Error ? err.message : "Failed to create timeline block.";

      handleCancelBlock(blockId);
    }
  }

  /**
   * Cancel creation of a block.
   */
  function handleCancelBlock(blockId: string) {
    blocks = blocks.filter((block) => block.id !== blockId);

    editingBlockId = null;
  }

  /**
   * Update a block locally while it is being moved.
   *
   * This is intentionally NOT persisted here.
   */
  function handleBlockMove(blockId: string, start: number, end: number) {
    blocks = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            start,
            end,
          }
        : block,
    );
  }

  /**
   * Persist the final position of a block after
   * the move interaction finishes.
   */
  async function handleBlockMoveEnd(
    blockId: string,
    start: number,
    end: number,
    originalStart: number,
    originalEnd: number,
  ) {
    try {
      await updateRange(blockId, {
        start: minutesToTimestamp(start),
        end: minutesToTimestamp(end),
      });
    } catch (err) {
      console.error("Failed to save moved timeline range:", err);

      /*
       * Revert the optimistic UI update if the
       * database update fails.
       */
      blocks = blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              start: originalStart,
              end: originalEnd,
            }
          : block,
      );

      error =
        err instanceof Error
          ? err.message
          : "Failed to save moved timeline block.";
    }
  }

  /**
   * Update the position of a block locally after
   * resizing.
   *
   * Persistence will be added next.
   */
  function handleBlockResize(blockId: string, start: number, end: number) {
    blocks = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            start,
            end,
          }
        : block,
    );
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
    <div class="wrapper">
      <TimelineRuler {config} />

      <TimelineGrid
        {config}
        {blocks}
        {editingBlockId}
        oncreateblock={handleCreateBlock}
        onblocktitlechange={handleBlockTitleChange}
        oncancelblock={handleCancelBlock}
        onblockmove={handleBlockMove}
        onblockmoveend={handleBlockMoveEnd}
        onblockresize={handleBlockResize}
      />
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
