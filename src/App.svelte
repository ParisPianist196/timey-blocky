<script lang="ts">
  import { randomColor, contrastText } from "./colors";

  /* ---- Time slots ---- */
  const times = [
    600, 615, 630, 645, 700, 715, 730, 745, 800, 815, 830, 845, 900, 915, 930,
    945, 1000, 1015, 1030, 1045, 1100, 1115, 1130, 1145, 1200, 1215, 1230, 1245,
    1300, 1315, 1330, 1345, 1400, 1415, 1430, 1445, 1500, 1515, 1530, 1545,
    1600, 1615, 1630, 1645, 1700, 1715, 1730, 1745, 1800, 1815, 1830, 1845,
    1900, 1915, 1930, 1945, 2000, 2015, 2030, 2045, 2100, 2115, 2130, 2145,
    2200, 2215, 2230, 2245, 2300, 2315, 2330, 2345, 2400,
  ];

  /* ---- Drag state ---- */
  let isDragging = $state(false);
  let dragStart = $state<number | null>(null);
  let dragEnd = $state<number | null>(null);
  let previewColor = $state("");
  let curInput = $state<HTMLInputElement | null>(null);
  let inputLabelOn = $state(false);

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
    inputLabelOn = true;

    isDragging = false;
    dragStart = null;
    dragEnd = null;
  }

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
        inputLabelOn: time == committed.start,
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

  $effect(() => {
    if (inputLabelOn && curInput) {
      curInput.focus();
      curInput.select(); // optional
    }
  });
  function formatTime(time: number): string {
    const hours24 = Math.floor(time / 100);
    const minutes = time % 100;

    // Handle 24:00 as 12:00 AM
    if (hours24 === 24) {
      return "12:00 AM";
    }

    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  }
</script>

<main>
  <h1>🕰️TimeyBlocky🕰️</h1>
  <button class="clear-button" onclick={() => (ranges = [])}>Clear</button>
  <div class="time-grid" onpointerup={endDrag} onpointerleave={endDrag}>
    {#each times as time}
      {@const style = cellStyle(time)}

      {formatTime(time)}
      <button
        class="cell"
        style="
          background-color: {style.bg};
          color: {style.text};
        "
        onpointerdown={() => startDrag(time)}
        onpointerenter={() => enterDrag(time)}
      >
        {#if style.inputLabelOn}
          <input
            bind:this={curInput}
            style="
          background-color: {style.bg};
          color: {style.text};
        "
          />
        {:else}
          {style.label}
        {/if}
      </button>
    {/each}
  </div>
</main>

<style>
  h1 {
    text-align: center;
  }
  .clear-button {
    border-radius: 12px;
    padding: 8px 4px;
    background-color: var(--font-color);
    color: var(--contrast-color);
    margin-bottom: 20px;
  }
  .time-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    user-select: none;
  }

  .cell {
    height: 32px;
    cursor: pointer;
    font-weight: 500;
  }

  .cell:nth-child(1) {
    border-radius: 12px 12px 0 0;
  }
  .cell:last-child {
    border-radius: 0 0 12px 12px;
  }

  input {
    background-color: transparent;
    border: none;
  }
</style>
