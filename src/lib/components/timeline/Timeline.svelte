<script lang="ts">
  import TimelineGrid from "@components/timeline/TimelineGrid.svelte";

  import { getRanges } from "@db/ranges";
  import { getCurrentUser } from "@lib/db/auth";

  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  import TimelineRuler from "./TimelineRuler.svelte";

  const config: TimelineConfig = {
    dayStart: 600,
    dayEnd: 1440,
    snapMinutes: 15,
    pixelsPerHour: 80,
  };

  const blockColors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#22c55e",
    "#14b8a6",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#ec4899",
    "#f43f5e",
  ];

  let blocks: TimeBlock[] = $state([]);
  let editingBlockId = $state<string | null>(null);

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
   * Return a random color from the timeline block palette.
   */
  function getRandomBlockColor(): string {
    const index = Math.floor(Math.random() * blockColors.length);

    return blockColors[index];
  }

  /**
   * Convert a database time value such as "10:30:00"
   * into minutes since midnight.
   */
  function timeStringToMinutes(timestamp: string): number {
    const date = new Date(timestamp);

    return date.getHours() * 60 + date.getMinutes();
  }

  /**
   * Add a newly-created block to the local timeline and
   * immediately put it into title-editing mode.
   */
  function handleCreateBlock(range: { start: number; end: number }) {
    const block: TimeBlock = {
      id: crypto.randomUUID(),
      start: range.start,
      end: range.end,
      color: getRandomBlockColor(),
      label: "",
    };

    blocks = [...blocks, block];
    editingBlockId = block.id;
  }

  /**
   * Update the title of a block currently being edited.
   */
  function handleBlockTitleChange(blockId: string, title: string) {
    blocks = blocks.map((block) =>
      block.id === blockId ? { ...block, label: title } : block,
    );

    editingBlockId = null;
  }

  /**
   * Cancel creation of a block currently being edited.
   */
  function handleCancelBlock(blockId: string) {
    blocks = blocks.filter((block) => block.id !== blockId);
    editingBlockId = null;
  }

  /**
   * Update the position of a block after a move.
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
