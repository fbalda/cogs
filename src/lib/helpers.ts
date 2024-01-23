import { Camera, Vector3, Vector4 } from "three";

const checkRayPlaneIntersection = (
  rayOrigin: Vector3,
  rayDirection: Vector3,
  planeNormal: Vector3,
  planeCenter: Vector3
) => {
  const denom = planeNormal.dot(rayDirection);

  if (Math.abs(denom) <= 0.0001) {
    // Ray parallel to plane
    return undefined;
  }

  const t = planeCenter.sub(rayOrigin).dot(planeNormal) / denom;

  if (t <= 0.0001) {
    return undefined;
  }

  return rayOrigin.clone().add(rayDirection.multiplyScalar(t));
};

export const screenToWorldPosition = (
  x: number,
  y: number,
  screenWidth: number,
  screenHeight: number,
  camera: Camera,
  planeOffset: number
) => {
  const hcc = new Vector4(
    (2.0 * x) / screenWidth - 1.0,
    1.0 - (2.0 * y) / screenHeight,
    -1.0,
    1.0
  );

  const rayEye = hcc.applyMatrix4(camera.projectionMatrixInverse);
  rayEye.z = -1;
  rayEye.w = 0;

  const rayWorld4 = rayEye.applyMatrix4(camera.matrixWorldInverse);

  const rayWorld = new Vector3(
    rayWorld4.x,
    rayWorld4.y,
    rayWorld4.z
  ).normalize();

  return checkRayPlaneIntersection(
    camera.position,
    rayWorld,
    new Vector3(0, 0, 1),
    new Vector3(0, 0, planeOffset)
  );
};
