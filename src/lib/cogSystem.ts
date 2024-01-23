import { Camera, Mesh, Vector2, Vector3, type Scene } from "three";
import { createCogMesh } from "./cogMesh";
import { screenToWorldPosition } from "./helpers";
import {
  calculateCogDimensions,
  slopeWidth,
  toothHeight,
  toothTopWidth,
  toothValleyWidth,
} from "./cogHelpers";
import {
  cogMaterial,
  previewInvalidMaterial,
  previewValidMaterial,
} from "./materials";

export interface CogSystemParams {
  scene: Scene;
  speed: number;
  onDragStatusChange: (isDragging: boolean) => void;
}

interface CogParameters {
  scene: Scene;
  position: Vector2;
  rotation: number;
  toothCount: number;
  connection?: Cog;
}

interface Cog {
  position: Vector2;
  mesh: Mesh;
  baseRotation: number;
  direction: number;
  toothCount: number;
  outerRadius: number;
  innerRadius: number;
  connections: Cog[];
}

const collisionOffset = 0.5;
const connectionOffset = 0.5;
const cogScale = 0.1;

const createCog = (params: CogParameters): Cog => {
  const position = params.position.clone();

  const mesh = createCogMesh({
    toothCount: params.toothCount,
    toothTopWidth,
    toothValleyWidth,
    toothHeight,
    slopeWidth,
  });

  mesh.material = cogMaterial;
  mesh.scale.x = cogScale;
  mesh.scale.y = cogScale;
  mesh.scale.z = cogScale;

  params.scene.add(mesh);

  const { outerRadius, innerRadius } = calculateCogDimensions(
    params.toothCount,
    toothTopWidth,
    toothValleyWidth,
    toothHeight,
    slopeWidth
  );

  return {
    mesh,
    position,
    baseRotation: 0,
    direction: 1,
    toothCount: params.toothCount,
    outerRadius,
    innerRadius,
    connections: [...(params.connection ? [params.connection] : [])],
  };
};

// TODO: Use spatial partitioning/quadtree to optimize collision
// detection/raycasting

const getClosestCollidingCog = (
  position: Vector2,
  outerRadius: number,
  others: Cog[]
) => {
  const result = others.reduce<{ cog: Cog; distance: number } | undefined>(
    (prev, current) => {
      const distance = new Vector2(
        current.position.x - position.x,
        current.position.y - position.y
      ).length();

      if (prev && prev.distance <= distance) {
        return prev;
      }

      if (
        distance <
        (current.outerRadius + outerRadius + collisionOffset) * cogScale
      ) {
        return {
          cog: current,
          distance,
        };
      }

      return prev;
    },
    undefined
  );

  return result?.cog;
};

const getAnyCollidingCog = (
  position: Vector2,
  outerRadius: number,
  others: Cog[],
  ignore: Cog[] = []
) => {
  return others.find((cog) => {
    if (ignore.find((ignoreCog) => ignoreCog === cog)) {
      return false;
    }

    const distance = new Vector2(
      cog.position.x - position.x,
      cog.position.y - position.y
    ).length();

    return (
      distance < (cog.outerRadius + outerRadius + collisionOffset) * cogScale
    );
  });
};

// We employ a bit of a hack here to not actually have to check ray-mesh
// intersections: As all of our targets (cogs) are extruded circles of a
// certain height, we can first check if there are is a cog within the radius of
// the intersection of the cursor ray with a plane that is a distance x above
// the bottom plane, where x is the height of the cogs, projected onto the
// bottom plane. If there is, use that one otherwise check within the radius of
// the intersection with the bottom plane.
const _pickCogAtPosition = (
  lowerPlanePosition: Vector2,
  upperPlanePosition: Vector2,
  cogs: Cog[]
): Cog | undefined => {
  // Ignore cogs with 2 or more connections (easier to handle)
  const validCogs = cogs.filter((cog) => cog.connections.length < 2);

  if (!validCogs.length) {
    return undefined;
  }

  // Check upper plane
  const upperPlaneResult = validCogs.find((cog) => {
    return (
      cog.position.distanceTo(upperPlanePosition) < cog.outerRadius * cogScale
    );
  });

  if (upperPlaneResult) {
    return upperPlaneResult;
  }

  // Check lower plane
  return validCogs.find((cog) => {
    return (
      cog.position.distanceTo(lowerPlanePosition) < cog.outerRadius * cogScale
    );
  });
};

const createCogSystem = (params: CogSystemParams) => {
  const cogs: Cog[] = [];
  let dragCog: Cog | undefined = undefined;
  let isDragCogPlacementValid = false;

  let normalizedRotation = 0;

  const cog = createCog({
    scene: params.scene,
    position: new Vector2(0, 0),
    rotation: 0,
    toothCount: 20,
  });

  cog.mesh.position.x = 0;
  cog.mesh.position.y = 0;

  cog.mesh.receiveShadow = true;

  cogs.push(cog);

  let lastCursorPlanePosition = new Vector2();

  const updateDragCog = (): false | Cog | undefined => {
    if (!dragCog) {
      return undefined;
    }

    dragCog.position = lastCursorPlanePosition;
    dragCog.mesh.position.x = lastCursorPlanePosition.x;
    dragCog.mesh.position.y = lastCursorPlanePosition.y;

    if (!cogs.length) {
      return undefined;
    }

    const collidingCog = getClosestCollidingCog(
      lastCursorPlanePosition,
      dragCog.outerRadius,
      cogs
    );

    if (!collidingCog) {
      return false;
    }

    const distanceVector = new Vector2(
      lastCursorPlanePosition.x - collidingCog.position.x,
      lastCursorPlanePosition.y - collidingCog.position.y
    );

    let offsetDirection = distanceVector.normalize();

    if (offsetDirection.lengthSq() === 0) {
      // If we hit the exact center of the parent cog, initialize to
      // random vector as a failsafe
      offsetDirection = new Vector2(1, 0);
    }

    const placementPosition = new Vector2()
      .copy(collidingCog.position)
      .add(
        new Vector2()
          .copy(offsetDirection)
          .multiplyScalar(
            (collidingCog.innerRadius +
              dragCog.innerRadius +
              toothHeight +
              connectionOffset) *
              cogScale
          )
      );

    if (
      getAnyCollidingCog(placementPosition, dragCog.outerRadius, cogs, [
        collidingCog,
      ])
    ) {
      return false;
    }

    dragCog.position = placementPosition;
    dragCog.mesh.position.x = dragCog.position.x;
    dragCog.mesh.position.y = dragCog.position.y;

    let baseRotation = collidingCog.baseRotation;

    const parentRotationVector = new Vector2(
      Math.cos(baseRotation),
      Math.sin(baseRotation)
    );

    const differenceAngle = Math.atan2(
      parentRotationVector.x * offsetDirection.y -
        parentRotationVector.y * offsetDirection.x,
      parentRotationVector.x * offsetDirection.x +
        parentRotationVector.y * offsetDirection.y
    );

    const offset =
      dragCog.toothCount % 2 !== 0
        ? ((Math.PI * 2) / dragCog.toothCount) * 0.5
        : 0;

    baseRotation +=
      differenceAngle * (collidingCog.toothCount / dragCog.toothCount) +
      differenceAngle +
      offset;

    dragCog.baseRotation = baseRotation;
    dragCog.direction = collidingCog.direction * -1;
    return collidingCog;
  };

  return {
    update: (deltaTime: number, cursorPosition: Vector2, camera: Camera) => {
      normalizedRotation += deltaTime * params.speed;

      const planeCursorIntersection =
        screenToWorldPosition(
          cursorPosition.x,
          cursorPosition.y,
          window.innerWidth,
          window.innerHeight,
          camera,
          0
        ) || new Vector3(0, 0, 0);

      lastCursorPlanePosition = new Vector2(
        planeCursorIntersection.x,
        planeCursorIntersection.y
      );

      const cogsToUpdate = [...cogs];

      if (dragCog) {
        if (updateDragCog() !== false) {
          dragCog.mesh.material = previewValidMaterial;
          isDragCogPlacementValid = true;
          cogsToUpdate.push(dragCog);
        } else {
          dragCog.mesh.material = previewInvalidMaterial;
          isDragCogPlacementValid = false;
        }
      }

      cogsToUpdate.forEach((cog) => {
        cog.mesh.rotation.z =
          cog.baseRotation +
          (normalizedRotation * cog.direction) / cog.toothCount;
      });
    },
    onPointerDown: () => {
      // Eventually needed for drag-to-move functionality
    },
    onPointerUp: () => {
      if (!dragCog) {
        return;
      }

      params.onDragStatusChange(false);

      if (!isDragCogPlacementValid) {
        params.scene.remove(dragCog.mesh);
        dragCog = undefined;
        return;
      }

      dragCog.mesh.material = cogMaterial;
      dragCog.mesh.castShadow = true;
      dragCog.mesh.receiveShadow = true;

      cogs.push(dragCog);
      dragCog = undefined;
    },
    createDragCog: (toothCount: number) => {
      if (dragCog) {
        params.scene.remove(dragCog.mesh);
      }

      dragCog = createCog({
        position: new Vector2(0, 0),
        rotation: 0,
        scene: params.scene,
        toothCount,
      });

      dragCog.mesh.material = previewInvalidMaterial;
      dragCog.mesh.castShadow = false;
      dragCog.mesh.receiveShadow = false;

      params.onDragStatusChange(true);
    },
    reset: () => {
      cogs.forEach((cog) => params.scene.remove(cog.mesh));
      cogs.length = 0;
      if (dragCog) {
        params.scene.remove(dragCog.mesh);
        dragCog = undefined;
      }
    },
  };
};

export default createCogSystem;
