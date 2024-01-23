<script lang="ts">
  import { onMount } from "svelte";
  import {
    type CogShapeParameters,
    minToothCount,
    maxToothCount,
    defaultToothCount,
    drawCogShape,
  } from "./cogHelpers";

  import { TrashIcon, MoveIcon } from "svelte-feather-icons";

  export let isDragging: boolean;
  export let onDragStart: (toothCount: number) => void;
  export let onReset: () => void;

  export let cogShapeSettings: Omit<CogShapeParameters, "toothCount">;

  const canvasSize = 48;
  const canvasPadding = 8;

  export const cogFillColor = "rgb(69, 69, 69)";
  export const cogStrokeColor = "white";
  export const cogShadowColor = "rgba(0, 0, 0, 0.4)";

  const canvasBufferSizePx = canvasSize * window.devicePixelRatio;

  let sliderElement: HTMLInputElement;
  let canvasElement: HTMLCanvasElement;
  let currentToothCount = 0;

  const updateToothCount = () => {
    currentToothCount = parseInt(sliderElement.value) || 0;

    const context = canvasElement.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "white";
    context.clearRect(0, 0, canvasBufferSizePx, canvasBufferSizePx);

    drawCogShape(
      context,
      cogFillColor,
      cogStrokeColor,
      cogShadowColor,
      canvasBufferSizePx,
      canvasPadding,
      { toothCount: currentToothCount, ...cogShapeSettings }
    );
  };

  onMount(() => {
    updateToothCount();
  });

  const onChange = () => {
    updateToothCount();
  };
</script>

<div class="wrapper" style:--cursor={isDragging ? "grabbing" : "auto"}>
  <div class="drag-panel">
    <canvas
      bind:this={canvasElement}
      width={`${canvasBufferSizePx}px`}
      height={`${canvasBufferSizePx}px`}
      style={`width: ${canvasSize}px; height: ${canvasSize}`}
      on:pointerdown={() => onDragStart(currentToothCount)}
    />
    <div class="tooth-count">{currentToothCount}</div>
    <div class="move-icon">
      <MoveIcon size="14" />
    </div>
  </div>

  <input
    name="toothCount"
    type="range"
    min={minToothCount}
    max={maxToothCount}
    step={1}
    value={defaultToothCount}
    on:input={onChange}
    bind:this={sliderElement}
  />

  <button on:click={onReset}>
    <TrashIcon />
  </button>
</div>

<style>
  :root {
    --col-base: rgb(213, 213, 213);
    --col-dark: rgb(47, 47, 47);
    --col-semi-dark: rgb(89, 89, 89);
    --col-highlight: white;
    --col-shadow: rgba(57, 57, 57, 0.8);
  }

  .wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    border-radius: 0.4rem 0.4rem 0 0;
    padding: 0.6rem;
    gap: 1rem;
    background-color: var(--col-base);
  }

  .wrapper,
  .wrapper * {
    cursor: var(--cursor);
  }

  input {
    width: 100%;
    border-radius: 1rem;
    background-color: var(--col-semi-dark);
  }

  input::-webkit-slider-thumb,
  input::-moz-range-thumb {
    appearance: none;
    width: 25px;
    height: 25px;
    background-color: white;
    border-radius: 25px;
    border: none;
    box-shadow: 0px 1px 2px 0px var(--col-shadow);
    cursor: pointer;
  }

  .drag-panel {
    border-radius: 0.4rem;
    background-color: white;
    padding: 0.2rem;
    position: relative;
    display: flex;
    box-shadow: 0px 1px 3px 2px inset var(--col-shadow);
    color: var(--col-dark);
  }

  .drag-panel * {
    cursor: grab;
  }

  .tooth-count {
    position: absolute;
    top: 0;
    right: 0.3rem;
    font-weight: bold;
    font-size: 0.8rem;
    text-shadow: -1px 1px 2px var(--col-highlight);
    pointer-events: none;
  }

  .move-icon {
    position: absolute;
    bottom: 0.19rem;
    right: 0.19rem;
    color: var(--col-dark);
    background-color: var(--col-highlight);
    width: 1rem;
    height: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.07rem 0rem 0rem 0.07rem;
    border-radius: 100%;
    pointer-events: none;
  }

  button {
    flex-shrink: 0;
    border: none;
    border-radius: 0.4rem;
    cursor: pointer;
    background-color: var(--col-dark);
    height: 2.5rem;
    aspect-ratio: 1/1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0px 2px 1px rgba(0, 0, 0, 0.2);
  }

  @media screen and (min-width: 480px) {
    .wrapper {
      top: 0;
      bottom: auto;
      left: auto;
      border-radius: 0 0 0 0.4rem;
    }
  }
</style>
