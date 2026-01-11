<script lang="ts">
  import { contrastText, randomColor } from "./colors";

  let allIncrements = $state<{
    [key: number]: { label: string; color: string };
  }>({
    600: { label: "", color: "" },
    700: { label: "", color: "" },
    800: { label: "", color: "" },
    900: { label: "", color: "" },
    1000: { label: "", color: "" },
    1100: { label: "", color: "" },
    1200: { label: "", color: "" },
    1300: { label: "", color: "" },
    1400: { label: "", color: "" },
    1500: { label: "", color: "" },
    1600: { label: "", color: "" },
    1700: { label: "", color: "" },
    1800: { label: "", color: "" },
    1900: { label: "", color: "" },
    2000: { label: "", color: "" },
    2100: { label: "", color: "" },
    2200: { label: "", color: "" },
    2300: { label: "", color: "" },
    2400: { label: "", color: "" },
  });

  let isDragging = $state(false);
  let dragStart = $state<number | null>(null);
  let dragEnd = $state<number | null>(null);
  let ranges = $state<
    Array<{ label: string; color: string; increments: number[] }>
  >([]);

  function startDrag(index: number) {
    isDragging = true;
    dragStart = index;
    dragEnd = index;
  }

  function enterDrag(index: number) {
    if (!isDragging) return;
    addSelection();
    dragEnd = index;
  }

  function endDrag() {
    isDragging = false;
  }

  let addSelection = () => {
    if (!(dragStart && dragEnd)) {
      return;
    }
    const min = Math.min(dragStart, dragEnd);
    const max = Math.max(dragStart, dragEnd);
    const color = randomColor();

    allIncrements[min].label = "test";

    for (let incr of Object.keys(allIncrements)) {
      if (Number(incr) >= min && Number(incr) <= max)
        allIncrements[Number(incr)].color = color;
    }
  };
</script>

<main>
  <h1>TimeyBlocky</h1>

  <div class="time-grid" onpointerup={endDrag} onpointerleave={endDrag}>
    {#each Object.keys(allIncrements) as time}
      {time}
      <button
        class="increment"
        style={`background-color: ${allIncrements[Number(time)].color}; color: ${contrastText(allIncrements[Number(time)].color)}`}
        onmousedown={() => startDrag(Number(time))}
        onmouseenter={() => enterDrag(Number(time))}
      >
        {allIncrements[Number(time)].label}
      </button>
    {/each}
  </div>
</main>

<style>
  .time-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .increment {
    height: 32px;
    border: 1px solid black;
    cursor: pointer;
  }
</style>
