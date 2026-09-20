<script lang="ts">
  let { rows = 5, height = 14 }: { rows?: number; height?: number } = $props();
</script>

<div class="sk">
  {#each Array(rows) as _, i}
    <div class="skeleton" style:height="{height}px" style:width="{90 - ((i * 17) % 35)}%"></div>
  {/each}
</div>

<style>
  .sk {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
</style>
