import { Shape, Vector2 } from "three";

// TODO: Make configurable
export const minToothCount = 7;
export const maxToothCount = 40;
export const defaultToothCount = 10;
export const toothTopWidth = 1.5;
export const toothValleyWidth = 1.65;
export const toothHeight = 2.5;
export const slopeWidth = 0.7;

export interface CogShapeParameters {
  toothCount: number;
  toothTopWidth: number;
  toothValleyWidth: number;
  toothHeight: number;
  slopeWidth: number;
}

export const calculateCogDimensions = (
  toothCount: number,
  toothTopWidth: number,
  toothValleyWidth: number,
  toothHeight: number,
  slopeWidth: number
) => {
  const innerCircumference =
    toothCount * (slopeWidth * 2 + toothTopWidth + toothValleyWidth);
  const innerRadius = innerCircumference / (2 * Math.PI);
  const outerRadius = innerRadius + toothHeight;
  const outerCircumference = outerRadius * (2 * Math.PI);

  return {
    innerCircumference,
    outerCircumference,
    innerRadius,
    outerRadius,
  };
};

export const createCogShapes = (params: CogShapeParameters) => {
  const toothCount = Math.floor(params.toothCount);

  const { toothTopWidth, toothValleyWidth, toothHeight, slopeWidth } = params;

  const { innerCircumference, innerRadius } = calculateCogDimensions(
    toothCount,
    toothTopWidth,
    toothValleyWidth,
    toothHeight,
    slopeWidth
  );

  const resolution = 1 + 3 / innerRadius;

  const valleyResolution = Math.ceil(toothValleyWidth * resolution);
  const topResolution = Math.ceil(toothTopWidth * resolution);

  const valleyAngle = (toothValleyWidth / innerCircumference) * Math.PI * 2;
  const topAngle = (toothTopWidth / innerCircumference) * Math.PI * 2;
  const slopeAngle = (slopeWidth / innerCircumference) * Math.PI * 2;

  const startAngleOffset =
    slopeAngle * 0.5 * (toothTopWidth / toothValleyWidth);

  const cogShape = new Shape();

  const drawValley = (valleyIndex: number) => {
    const startAngle =
      startAngleOffset +
      valleyIndex * (valleyAngle + topAngle + 2 * slopeAngle);

    let startIndex = 0;

    if (valleyIndex === 0) {
      const positionVector = angleToVector(startAngle);

      cogShape.moveTo(
        positionVector.x * innerRadius,
        positionVector.y * innerRadius
      );

      startIndex = 1;
    }

    for (let i = startIndex; i < valleyResolution; i++) {
      const positionVector = angleToVector(
        startAngle + valleyAngle * (i / (valleyResolution - 1))
      );

      cogShape.lineTo(
        positionVector.x * innerRadius,
        positionVector.y * innerRadius
      );
    }
  };

  const drawTooth = (toothIndex: number) => {
    const startAngle =
      startAngleOffset +
      (toothIndex + 1) * valleyAngle +
      toothIndex * (topAngle + slopeAngle * 2) +
      slopeAngle;

    const endAngle = startAngle + topAngle;

    const startAngleVector = angleToVector(startAngle);
    const endAngleVector = angleToVector(endAngle);

    const difVector = endAngleVector.sub(startAngleVector);

    const perpVector = new Vector2(difVector.y, -difVector.x);

    perpVector.normalize();

    for (let i = 0; i < topResolution; i++) {
      const positionVector = angleToVector(
        startAngle + topAngle * (i / (topResolution - 1))
      );

      cogShape.lineTo(
        positionVector.x * innerRadius + perpVector.x * toothHeight,
        positionVector.y * innerRadius + perpVector.y * toothHeight
      );
    }
  };

  const angleToVector = (angle: number) => {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  };

  for (let i = 0; i < toothCount; i++) {
    drawValley(i);
    drawTooth(i);
  }

  cogShape.closePath();

  const rimWidth = 0.1 + innerRadius * 0.1;

  const axleRadius = innerRadius * 0.3;
  const axleHoleRadius = axleRadius * 0.4;

  const holeShapes: Shape[] = [];

  let holeCount = 0;

  if (toothCount >= 14) {
    const rimAxleRadiusDiff = innerRadius - rimWidth - axleRadius;
    const midRadius = axleRadius + rimAxleRadiusDiff * 0.5;
    const midCircumference = midRadius * 2 * Math.PI;
    const holeRadius = rimAxleRadiusDiff * 0.5 * 0.8;

    holeCount = Math.floor((midCircumference * 0.7) / (holeRadius * 2));

    for (let i = 0; i < holeCount; i++) {
      const shape = new Shape();

      const angle = ((2 * Math.PI) / holeCount) * i;

      const position = new Vector2(
        Math.cos(angle) * midRadius,
        Math.sin(angle) * midRadius
      );

      shape.absarc(position.x, position.y, holeRadius, 0, Math.PI * 2);

      holeShapes.push(shape);
    }
  }

  return {
    shape: cogShape,
    holeShapes,
    innerRadius,
    outerRadius: innerRadius + toothHeight,
    rimWidth,
    axleRadius,
    axleHoleRadius,
    holeCount,
  };
};

export const drawCogShape = (
  context: CanvasRenderingContext2D,
  fillColor: string,
  strokeColor: string,
  shadowColor: string,
  canvasBufferSize: number,
  canvasPadding: number,
  cogParams: CogShapeParameters
) => {
  context.strokeStyle = strokeColor;
  context.lineWidth = 1.5;
  context.fillStyle = fillColor;
  context.shadowBlur = 2;
  context.shadowOffsetY = 5;
  context.shadowColor = shadowColor;

  const cogShapes = createCogShapes(cogParams);

  const createCenteredCircleShape = (radius: number) => {
    const shape = new Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2);
    return shape;
  };

  const rimShape = createCenteredCircleShape(
    cogShapes.innerRadius - cogShapes.rimWidth
  );
  const axleShape = createCenteredCircleShape(cogShapes.axleRadius);
  const axleHoleShape = createCenteredCircleShape(cogShapes.axleHoleRadius);

  const shapes = [
    ...cogShapes.holeShapes,
    rimShape,
    axleShape,
    axleHoleShape,
  ].map((shape) => shape.getPoints(12));

  const drawableCanvasWidth = canvasBufferSize - canvasPadding * 2;

  const scaleFactor = drawableCanvasWidth / (cogShapes.outerRadius * 2);

  const transformPoint = (point: Vector2): [number, number] => {
    return [
      0.5 * canvasBufferSize + point.x * scaleFactor,
      0.5 * canvasBufferSize + point.y * scaleFactor,
    ];
  };

  const drawShape = (points: Vector2[]) => {
    if (!points.length) {
      return;
    }
    context.beginPath();

    context.moveTo(...transformPoint(points[0]));

    for (let i = 1; i < points.length; i++) {
      context.lineTo(...transformPoint(points[i]));
    }

    context.closePath();
  };

  drawShape(cogShapes.shape.getPoints(12));
  context.fill();

  context.shadowColor = "rgba(0, 0, 0, 0)";

  shapes.forEach((shapePoints) => {
    drawShape(shapePoints);
    context.stroke();
  });
};
