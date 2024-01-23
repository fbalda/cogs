import { BufferGeometry, ExtrudeGeometry, Mesh, Shape } from "three";
import { createCogShapes, type CogShapeParameters } from "./cogHelpers";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const createCogMesh = (params: CogShapeParameters) => {
  const cogShape = createCogShapes(params);

  const geometries: BufferGeometry[] = [];

  const bigHoleShape = new Shape();
  bigHoleShape.arc(
    0,
    0,
    cogShape.innerRadius - cogShape.rimWidth,
    0,
    2 * Math.PI
  );

  cogShape.shape.holes.push(bigHoleShape);

  const circleShape = new Shape();
  circleShape.arc(
    0,
    0,
    cogShape.innerRadius - cogShape.rimWidth,
    0,
    2 * Math.PI
  );
  circleShape.closePath();
  circleShape.holes = cogShape.holeShapes;

  const innerGeometry = new ExtrudeGeometry(circleShape, {
    depth: 1,
    steps: 1,
  });

  geometries.push(innerGeometry);

  const baseGeometry = new ExtrudeGeometry(cogShape.shape, {
    depth: 2,
    steps: 1,
    curveSegments: 10 + Math.floor(params.toothCount / 2),
  });

  geometries.push(baseGeometry);

  const axleShape = new Shape();
  axleShape.arc(0, 0, cogShape.axleRadius, 0, 2 * Math.PI);

  const axleHole = new Shape();
  axleHole.arc(0, 0, cogShape.axleHoleRadius, 0, 2 * Math.PI);

  axleShape.holes.push(axleHole);

  geometries.push(
    new ExtrudeGeometry(axleShape, {
      depth: 2,
      steps: 1,
    })
  );

  const mergedGeometry = mergeGeometries(geometries);

  const cogMesh = new Mesh(mergedGeometry);

  cogMesh.receiveShadow = false;
  cogMesh.castShadow = true;

  return cogMesh;
};
