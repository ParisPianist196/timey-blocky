<script lang="ts">
  let allIncrements = $state([
    600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800,
    1900, 2000, 2100, 2200, 2300, 2400,
  ]);

  let isDragging = $state(false);
  let dragStart = $state<number | null>(null);
  let dragEnd = $state<number | null>(null);

  function startDrag(index: number) {
    isDragging = true;
    dragStart = index;
    dragEnd = index;
  }

  function enterDrag(index: number) {
    if (!isDragging) return;
    dragEnd = index;
  }

  function endDrag() {
    isDragging = false;
  }

  let selectedRange = $derived(() => {
    if (dragStart === null || dragEnd === null) return [];
    const min = Math.min(dragStart, dragEnd);
    const max = Math.max(dragStart, dragEnd);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  });
</script>

<main>
  <h1>Timey Blocky</h1>

  <div class="time-grid" onpointerup={endDrag} onpointerleave={endDrag}>
    {#each allIncrements as time, i}
      <button
        class="increment"
        class:selected={selectedRange().includes(i)}
        onmousedown={() => startDrag(i)}
        onmouseenter={() => enterDrag(i)}
      >
        {time}
      </button>
    {/each}
  </div>
</main>

<style>
  .time-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
  }

  .increment {
    border: 1px solid black;
    cursor: pointer;
  }

  .increment.selected {
    background: rgba(100, 108, 255, 0.4);
  }
</style>
