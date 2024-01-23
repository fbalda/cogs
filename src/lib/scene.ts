import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import createCogSystem from "./cogSystem";
import { planeMaterial } from "./materials";

const cameraPosition = new Vector3(0, 0, 10);

const fov = 50;
const nearPlane = 0.1;
const farPlane = cameraPosition.z;

const directionalLightIntensity = 1;
const directionalLightPosition = new Vector3(10, 10, 10);
// Increases directional light shadowed area
const directionalLightShadowCameraOffset = 15;
const directionalLightShadowMapSize = 2048;

const ambientLightIntensity = 2;

// Background plane size
const planeSize = new Vector2(50, 50);

export interface SetupSceneParameters {
  canvasElement: HTMLCanvasElement;
  onDragStatusChange: (isDragging: boolean) => void;
}

const setupScene = (params: SetupSceneParameters) => {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    nearPlane,
    farPlane
  );

  camera.position.set(...cameraPosition.toArray());
  camera.lookAt(new Vector3(0, 0, 0));

  const directionalLight = new DirectionalLight();
  directionalLight.intensity = directionalLightIntensity;
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.x = directionalLightShadowMapSize;
  directionalLight.shadow.mapSize.y = directionalLightShadowMapSize;
  directionalLight.position.copy(directionalLightPosition);

  directionalLight.shadow.camera.top = directionalLightShadowCameraOffset;
  directionalLight.shadow.camera.bottom = -directionalLightShadowCameraOffset;
  directionalLight.shadow.camera.left = -directionalLightShadowCameraOffset;
  directionalLight.shadow.camera.right = directionalLightShadowCameraOffset;

  directionalLight.target.position.x = 0;
  directionalLight.target.position.y = 0;
  directionalLight.target.position.z = 0;

  scene.add(directionalLight);
  scene.add(directionalLight.target);

  const ambientLight = new AmbientLight();
  ambientLight.intensity = ambientLightIntensity;
  scene.add(ambientLight);

  const planeGeometry = new PlaneGeometry(...planeSize.toArray());
  const planeMesh = new Mesh(planeGeometry, planeMaterial);
  planeMesh.receiveShadow = true;
  planeMesh.castShadow = false;

  scene.add(planeMesh);

  const cogSystem = createCogSystem({
    scene,
    speed: 10,
    onDragStatusChange: params.onDragStatusChange,
  });

  const renderer = new WebGLRenderer({
    antialias: true,
    canvas: params.canvasElement,
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const updateCamera = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };

  const onResize = () => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect =
      params.canvasElement.clientWidth / params.canvasElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  onResize();

  let pointerPosition: Vector2 = new Vector2();

  const onPointerMove = (evt: PointerEvent) => {
    pointerPosition = new Vector2(evt.clientX, evt.clientY);
  };

  const onPointerDown = (evt: PointerEvent) => {
    pointerPosition = new Vector2(evt.clientX, evt.clientY);
    cogSystem.onPointerDown();
  };

  const onPointerUp = (evt: PointerEvent) => {
    pointerPosition = new Vector2(evt.clientX, evt.clientY);
    cogSystem.onPointerUp();
  };

  window.addEventListener("resize", onResize, false);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);

  let frame = 0;
  let lastTimestamp = 0;

  const loop = (timestamp: number) => {
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    cogSystem.update(deltaTime, pointerPosition, camera);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(loop);
  };

  frame = requestAnimationFrame(loop);

  const destroy = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
  };

  return {
    destroy,
    createDragCog: cogSystem.createDragCog,
    reset: cogSystem.reset,
  };
};

export default setupScene;
