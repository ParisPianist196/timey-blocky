import {
  createRange,
  deleteRange,
  getRanges,
  updateRange,
  type NewRange,
} from "@db/ranges";

import type { TimeBlock } from "@timeline/types";

/**
 * Reactive timeline block state.
 *
 * We keep the state inside an object because Svelte 5 does not allow
 * an exported $state variable to be reassigned.
 */
export const timelineState = $state<{
  blocks: TimeBlock[];
  ownerId: string | null;
  loading: boolean;
  error: string | null;
}>({
  blocks: [],
  ownerId: null,
  loading: false,
  error: null,
});

/**
 * Convert a database timestamp such as
 * "2026-08-12T10:30:00+00:00"
 * into minutes since midnight.
 */
function timeStringToMinutes(timestamp: string): number {
  const date = new Date(timestamp);

  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Convert minutes since midnight into a database
 * timestamp string.
 *
 * The database range API currently expects a timestamp,
 * so we use today's date and the requested time.
 */
function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const minutesPart = minutes % 60;

  const date = new Date();

  date.setHours(hours, minutesPart, 0, 0);

  return date.toISOString();
}

/**
 * Convert a database range into a timeline block.
 */
function rangeToBlock(range: {
  id: string;
  start: string;
  end: string;
  color: string;
  label: string;
}): TimeBlock {
  return {
    id: range.id,
    start: timeStringToMinutes(range.start),
    end: timeStringToMinutes(range.end),
    color: range.color,
    label: range.label,
  };
}

/**
 * Get the current blocks.
 */
export function getBlocks(): TimeBlock[] {
  return timelineState.blocks;
}

/**
 * Get the current loading state.
 */
export function isBlocksLoading(): boolean {
  return timelineState.loading;
}

/**
 * Get the current error.
 */
export function getBlocksError(): string | null {
  return timelineState.error;
}

/**
 * Load all blocks belonging to the current user.
 */
export async function loadBlocks(userId: string): Promise<void> {
  timelineState.loading = true;
  timelineState.error = null;
  timelineState.ownerId = userId;

  try {
    const ranges = await getRanges(userId);

    timelineState.blocks = ranges.map(rangeToBlock);
  } catch (err) {
    console.error("Failed to load timeline blocks:", err);

    timelineState.error =
      err instanceof Error ? err.message : "Failed to load timeline blocks.";

    throw err;
  } finally {
    timelineState.loading = false;
  }
}

/**
 * Add a new block and persist it.
 *
 * The database generates the final block ID.
 */
export async function addBlock(block: TimeBlock): Promise<TimeBlock> {
  if (!timelineState.ownerId) {
    throw new Error("Cannot create a block without a signed-in user.");
  }

  const newRange: NewRange = {
    start: minutesToTimeString(block.start),
    end: minutesToTimeString(block.end),
    color: block.color,
    label: block.label,
    owner_id: timelineState.ownerId,
  };

  try {
    const range = await createRange(newRange);

    const persistedBlock = rangeToBlock(range);

    timelineState.blocks.push(persistedBlock);

    return persistedBlock;
  } catch (err) {
    console.error("Failed to create timeline block:", err);

    timelineState.error =
      err instanceof Error ? err.message : "Failed to create timeline block.";

    throw err;
  }
}

/**
 * Remove a block and persist the deletion.
 */
export async function removeBlock(blockId: string): Promise<void> {
  const index = timelineState.blocks.findIndex((block) => block.id === blockId);

  if (index === -1) {
    return;
  }

  const previousBlock = timelineState.blocks[index];

  // Optimistically remove it from the UI.
  timelineState.blocks.splice(index, 1);

  try {
    const deletedId = await deleteRange(blockId);

    if (!deletedId) {
      throw new Error("The block could not be deleted.");
    }
  } catch (err) {
    console.error("Failed to delete timeline block:", err);

    // Restore the block if persistence failed.
    timelineState.blocks.splice(index, 0, previousBlock);

    timelineState.error =
      err instanceof Error ? err.message : "Failed to delete timeline block.";

    throw err;
  }
}

/**
 * Find a block by ID.
 */
export function getBlock(blockId: string): TimeBlock | undefined {
  return timelineState.blocks.find((block) => block.id === blockId);
}

/**
 * Update a block locally and persist the changes.
 *
 * The local state is updated immediately so changes
 * such as editing a title or color feel instantaneous.
 *
 * If persistence fails, the previous state is restored.
 */
export async function updateBlock(
  blockId: string,
  updates: Partial<TimeBlock>,
): Promise<void> {
  const index = timelineState.blocks.findIndex((block) => block.id === blockId);

  if (index === -1) {
    return;
  }

  const previousBlock = {
    ...timelineState.blocks[index],
  };

  const updatedBlock = {
    ...previousBlock,
    ...updates,
  };

  // Update the UI immediately.
  timelineState.blocks[index] = updatedBlock;

  try {
    const changes: {
      start?: string;
      end?: string;
      color?: string;
      label?: string;
    } = {};

    if (updates.start !== undefined) {
      changes.start = minutesToTimeString(updatedBlock.start);
    }

    if (updates.end !== undefined) {
      changes.end = minutesToTimeString(updatedBlock.end);
    }

    if (updates.color !== undefined) {
      changes.color = updatedBlock.color;
    }

    if (updates.label !== undefined) {
      changes.label = updatedBlock.label;
    }

    const persistedRange = await updateRange(blockId, changes);

    if (!persistedRange) {
      throw new Error("The block could not be updated.");
    }
  } catch (err) {
    console.error("Failed to update timeline block:", err);

    // Roll back the optimistic update.
    timelineState.blocks[index] = previousBlock;

    timelineState.error =
      err instanceof Error ? err.message : "Failed to update timeline block.";

    throw err;
  }
}

/**
 * Update a block's time range.
 */
export async function updateBlockRange(
  blockId: string,
  start: number,
  end: number,
): Promise<void> {
  await updateBlock(blockId, {
    start,
    end,
  });
}

/**
 * Update a block's title.
 */
export async function updateBlockTitle(
  blockId: string,
  label: string,
): Promise<void> {
  await updateBlock(blockId, {
    label,
  });
}

/**
 * Update a block's color.
 */
export async function updateBlockColor(
  blockId: string,
  color: string,
): Promise<void> {
  await updateBlock(blockId, {
    color,
  });
}

/**
 * Replace all blocks locally.
 *
 * Useful for testing or resetting state.
 */
export function setBlocks(newBlocks: TimeBlock[]): void {
  timelineState.blocks = newBlocks;
}

/**
 * Clear all local blocks.
 */
export function clearBlocks(): void {
  timelineState.blocks = [];
  timelineState.ownerId = null;
  timelineState.error = null;
}
