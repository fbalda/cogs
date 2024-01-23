<script lang="ts">
  import { onMount } from "svelte";
  import ToolBar from "./ToolBar.svelte";
  import {
    slopeWidth,
    toothHeight,
    toothTopWidth,
    toothValleyWidth,
  } from "./cogHelpers";
  import setupScene from "./scene";

  let canvasElement: HTMLCanvasElement;

  let createDragCog: (toothCount: number) => void;
  let resetScene: () => void;

  let isDragging = false;

  onMount(() => {
    const scene = setupScene({
      canvasElement,
      onDragStatusChange: (newIsDragging) => (isDragging = newIsDragging),
    });

    createDragCog = scene.createDragCog;
    resetScene = scene.reset;

    return () => {
      scene.destroy();
    };
  });
</script>

<div>
  <canvas
    bind:this={canvasElement}
    style={`${isDragging ? "cursor: grabbing;" : ""}`}
  />
  <ToolBar
    onDragStart={createDragCog}
    onReset={resetScene}
    cogShapeSettings={{
      toothTopWidth,
      toothValleyWidth,
      toothHeight,
      slopeWidth,
    }}
    bind:isDragging
  />
</div>

<style>
  canvas {
    position: fixed;
    inset: 0;
  }
</style>
