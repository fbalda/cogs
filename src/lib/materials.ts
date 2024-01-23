import { AlwaysDepth, MeshBasicMaterial, MeshPhysicalMaterial } from "three";

export const planeMaterial = new MeshPhysicalMaterial({
  color: "#7b7b7b",
  roughness: 0.8,
  metalness: 0.9,
});

export const cogMaterial = new MeshPhysicalMaterial({
  color: "#7b7b7b",
  roughness: 0.5,
  metalness: 0.9,
});

export const previewValidMaterial = new MeshBasicMaterial({
  color: "#39c35b",
});

export const previewInvalidMaterial = new MeshBasicMaterial({
  color: "#e5695e",
  depthFunc: AlwaysDepth,
  // TODO: Not sure if this is necessary, but we need to make sure that this
  // material always gets rendered last (or at least after all the other cogs)
  // to prevent other cogs from rendering over it
  transparent: true,
});
