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

  let isDragging = $state(false);
  let dragStart = $state<number | null>(null);
  let dragEnd = $state<number | null>(null);
  let previewColor = $state("");
  let curInput = $state<HTMLInputElement | null>(null);
  let inputLabelOn = $state(false);
  let ranges = $state<
    Array<{ start: number; end: number; color: string; label: string }>
  >([]);

  /* ---- Load ranges from localStorage on init ---- */
  $effect(() => {
    const stored = localStorage.getItem("timeyblocky_ranges");
    if (stored) {
      try {
        ranges = JSON.parse(stored);
      } catch {
        ranges = [];
      }
    }
  });

  /* ---- Save ranges to localStorage whenever they change ---- */
  $effect(() => {
    localStorage.setItem("timeyblocky_ranges", JSON.stringify(ranges));
  });

  /* ---- Drag handlers ---- */
  function startDrag(time: number) {
    isDragging = true;
    dragStart = time;
    dragEnd = time;
    previewColor = randomColor();
  }

  function endDrag() {
    if (!isDragging || dragStart === null || dragEnd === null) {
      isDragging = false;
      return;
    }

    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd);

    if (hasOverlap(start, end)) {
      isDragging = false;
      dragStart = null;
      dragEnd = null;
      return;
    }

    ranges.push({
      start,
      end,
      color: previewColor,
      label: "",
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

    // ❌ don't preview over existing ranges
    return time >= min && time <= max && !committedRange(time);
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
        inputLabelOn: time === committed.start,
        label: time === committed.start ? committed.label : "",
        range: committed, // <-- pass the actual range
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

  function saveRanges() {
    localStorage.setItem("timeyblocky_ranges", JSON.stringify(ranges));
  }

  function removeRange(e: Event, time: number) {
    // Find the index of the range containing this time
    e.stopPropagation();
    const index = ranges.findIndex((r) => time >= r.start && time <= r.end);
    if (index !== -1) {
      ranges.splice(index, 1); // remove it
      saveRanges(); // persist
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;

    const time = el.getAttribute("data-time");
    if (time) {
      dragEnd = Number(time);
    }
  }
  function overlaps(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
  ) {
    return aStart <= bEnd && aEnd >= bStart;
  }

  function hasOverlap(start: number, end: number) {
    return ranges.some((r) => overlaps(start, end, r.start, r.end));
  }
</script>

<main>
  <h1>🕰️TimeyBlocky🕰️</h1>
  <button class="clear-button" onclick={() => (ranges = [])}>Clear</button>
  <div
    class="time-grid"
    onpointerdown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
    onpointermove={handlePointerMove}
    onpointerup={endDrag}
    onpointercancel={endDrag}
  >
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
        data-time={time}
      >
        {#if style.inputLabelOn}
          <input
            bind:this={curInput}
            bind:value={style.range.label}
            style="
              background-color: {style.bg};
              color: {style.text};
            "
            oninput={() => saveRanges()}
          />
          <span
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") removeRange(e, time);
            }}
            class="remove-btn"
            role="button"
            tabindex="0"
            onpointerdown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onclick={(e) => removeRange(e, time)}
          >
            ✕
          </span>
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
    position: fixed;
    bottom: 24px;
    right: 24px;
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
    text-align: start;
    max-width: 300px;
  }

  .cell {
    height: 32px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    padding: none;
    overflow: hidden;
    touch-action: none;
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
    max-width: 170px;
  }
  input:focus {
    border: none;
    outline: none;
    background-color: transparent;
  }
  .remove-btn {
    width: 27px;
    height: 27px;
    line-height: 27px;
  }
</style>
