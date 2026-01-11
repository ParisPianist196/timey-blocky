<script lang="ts">
  import { randomColor, contrastText } from "./colors";

  /* ---- Time slots ---- */
  const times = [
    600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800,
    1900, 2000, 2100, 2200, 2300, 2400,
  ];

  /* ---- Drag state ---- */
  let isDragging = $state(false);
  let dragStart = $state<number | null>(null);
  let dragEnd = $state<number | null>(null);
  let previewColor = $state("");

  /* ---- Committed ranges ---- */
  let ranges = $state<
    Array<{ start: number; end: number; color: string; label: string }>
  >([]);

  /* ---- Drag handlers ---- */
  function startDrag(time: number) {
    isDragging = true;
    dragStart = time;
    dragEnd = time;
    previewColor = randomColor();
  }

  function enterDrag(time: number) {
    if (!isDragging) return;
    dragEnd = time;
  }

  function endDrag() {
    if (!isDragging || dragStart === null || dragEnd === null) {
      isDragging = false;
      return;
    }

    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd);

    ranges.push({
      start,
      end,
      color: previewColor,
      label: "Block",
    });

    isDragging = false;
    dragStart = null;
    dragEnd = null;
  }

  /* ---- Derived helpers ---- */
  function inPreview(time: number) {
    if (!isDragging || dragStart === null || dragEnd === null) return false;
    const min = Math.min(dragStart, dragEnd);
    const max = Math.max(dragStart, dragEnd);
    return time >= min && time <= max;
  }

  function committedRange(time: number) {
    return ranges.find((r) => time >= r.start && time <= r.end);
  }

  function cellStyle(time: number) {
    const committed = committedRange(time);

    if (committed) {
      return {
        bg: committed.color,
        text: contrastText(committed.color),
        label: time == committed.start ? committed.label : "",
      };
    }

    if (inPreview(time)) {
      return {
        bg: previewColor,
        text: contrastText(previewColor),
        label: "",
      };
    }

    return { bg: "", text: "#000", label: "" };
  }
</script>

<main>
  <h1>TimeyBlocky</h1>

  <div class="time-grid" onpointerup={endDrag} onpointerleave={endDrag}>
    {#each times as time}
      {@const style = cellStyle(time)}

      {time}
      <button
        class="cell"
        style="
          background-color: {style.bg};
          color: {style.text};
        "
        onpointerdown={() => startDrag(time)}
        onpointerenter={() => enterDrag(time)}
      >
        {style.label}
      </button>
    {/each}
  </div>
</main>

<style>
  .time-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    user-select: none;
  }

  .cell {
    height: 32px;
    border: 1px solid #000;
    cursor: pointer;
    font-weight: 500;
  }
</style>
