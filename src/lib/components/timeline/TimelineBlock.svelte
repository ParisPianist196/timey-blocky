<script lang="ts">
  import type { TimeBlock, TimelineConfig } from "@timeline/types";

  interface Props {
    block: TimeBlock;
    config: TimelineConfig;
    top: number;
    height: number;
  }

  let { block, config, top, height }: Props = $props();
</script>

<div
  class="block"
  data-timeline-block
  style:top={`${top}px`}
  style:height={`${height}px`}
  style:background-color={block.color}
>
  <span class="label">
    {block.label}
  </span>
</div>

<style>
  .block {
    position: absolute;

    left: 48px;
    right: 0;

    border-radius: 8px;

    padding: 8px 12px;

    box-sizing: border-box;

    pointer-events: auto;

    color: white;
  }

  .label {
    font-weight: 500;
  }
</style>
