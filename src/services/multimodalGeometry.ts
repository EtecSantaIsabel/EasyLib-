import {
  BodyContextFeatures,
  BodyZone,
  FaceExpressionFeatures,
  FingerJointAngles,
  HandednessLabel,
  HandGeometryFeatures,
  NmfExpressionType,
  PalmFacing,
  Point3D
} from '../types/librasRecognition';

export function toPoint3D(p: { x: number; y: number; z?: number }): Point3D {
  return { x: p.x, y: p.y, z: p.z ?? 0 };
}

export function sub3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function add3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function scale3D(v: Point3D, s: number): Point3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function dot3D(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross3D(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function norm3D(v: Point3D): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function dist3D(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function dist2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize3D(v: Point3D): Point3D {
  const n = norm3D(v);
  if (n < 1e-6) return { x: 0, y: 0, z: 0 };
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

export function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

/**
 * Angle in degrees [0..180] between two 3D vectors v1 and v2.
 */
export function angleBetweenDeg(v1: Point3D, v2: Point3D): number {
  const n1 = norm3D(v1);
  const n2 = norm3D(v2);
  if (n1 < 1e-6 || n2 < 1e-6) return 0;
  const cos = Math.max(-1, Math.min(1, dot3D(v1, v2) / (n1 * n2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Joint bend angle at B given A -> B -> C.
 * Returns 180° when completely straight, ~20°-60° when tightly curled.
 */
function jointAngleAtB(a: Point3D, b: Point3D, c: Point3D): number {
  const ba = sub3D(a, b);
  const bc = sub3D(c, b);
  return angleBetweenDeg(ba, bc);
}

/**
 * Computes continuous 3D extension score [0..1] using joint angles (MCP, PIP, DIP)
 * AND wrist-distance ratios in 3D so foreshortened fingers pointing at camera remain accurate.
 */
function computeFingerAngles(
  wrist: Point3D,
  cmcOrMcp: Point3D,
  mcp: Point3D,
  pip: Point3D,
  dip: Point3D,
  tip: Point3D,
  palmScale: number,
  isThumb = false
): FingerJointAngles {
  const mcpAngleDeg = jointAngleAtB(cmcOrMcp, mcp, pip);
  const pipAngleDeg = jointAngleAtB(mcp, pip, dip);
  const dipAngleDeg = jointAngleAtB(pip, dip, tip);

  if (isThumb) {
    // Thumb bends gently even when extended (~140-180 deg)
    const angleScore = clamp01(((pipAngleDeg - 105) / 55 + (dipAngleDeg - 115) / 55) / 2);
    const tipDistRatio = clamp01((dist3D(tip, cmcOrMcp) / palmScale - 0.55) / 0.45);
    const extensionScore = clamp01(angleScore * 0.6 + tipDistRatio * 0.4);
    return {
      mcpAngleDeg,
      pipAngleDeg,
      dipAngleDeg,
      extensionScore,
      curlScore: 1 - extensionScore
    };
  }

  // For index/middle/ring/pinky: straight finger has PIP ~165-180°, DIP ~165-180°, MCP ~150-180°
  const pipScore = clamp01((pipAngleDeg - 85) / 85);
  const dipScore = clamp01((dipAngleDeg - 105) / 65);
  const mcpScore = clamp01((mcpAngleDeg - 95) / 70);
  const tipToMcpRatio = clamp01((dist3D(tip, mcp) / palmScale - 0.42) / 0.45);

  const extensionScore = clamp01(pipScore * 0.42 + dipScore * 0.25 + mcpScore * 0.18 + tipToMcpRatio * 0.15);

  return {
    mcpAngleDeg,
    pipAngleDeg,
    dipAngleDeg,
    extensionScore,
    curlScore: 1 - extensionScore
  };
}

function classifyPalmFacing(normal: Point3D, handedness: HandednessLabel): PalmFacing {
  const ax = Math.abs(normal.x);
  const ay = Math.abs(normal.y);
  const az = Math.abs(normal.z);

  if (az >= ax && az >= ay) {
    return normal.z < 0 ? 'camera' : 'signer';
  }
  if (ay >= ax && ay >= az) {
    // Remember image Y goes downward: negative Y is upward!
    return normal.y < 0 ? 'up' : 'down';
  }
  // X axis: depends on whether left or right hand
  if (handedness === 'Right') {
    return normal.x > 0 ? 'inward' : 'outward';
  }
  if (handedness === 'Left') {
    return normal.x < 0 ? 'inward' : 'outward';
  }
  return normal.x > 0 ? 'inward' : 'outward';
}

export function extractHandGeometry(
  rawLandmarks: { x: number; y: number; z?: number }[],
  handedness: HandednessLabel = 'Unknown',
  worldLandmarks?: { x: number; y: number; z?: number }[]
): HandGeometryFeatures {
  const pts = rawLandmarks.map(toPoint3D);
  // Use metric worldLandmarks if available for scale-free 3D joint angles; fallback to normalized pts
  const geoPts = worldLandmarks && worldLandmarks.length === 21 ? worldLandmarks.map(toPoint3D) : pts;

  const wrist = pts[0];
  const middleMcp = pts[9];
  const indexMcp = pts[5];
  const pinkyMcp = pts[17];

  const palmScale = Math.max(0.03, dist3D(wrist, middleMcp));
  const palmWidth = Math.max(0.02, dist3D(indexMcp, pinkyMcp));

  const geoWrist = geoPts[0];
  const geoMiddleMcp = geoPts[9];
  const geoPalmScale = Math.max(0.02, dist3D(geoWrist, geoMiddleMcp));

  const wristRelative = pts.map((p) => scale3D(sub3D(p, wrist), 1 / palmScale));

  const handCenter: Point3D = {
    x: (wrist.x + middleMcp.x + indexMcp.x + pinkyMcp.x) / 4,
    y: (wrist.y + middleMcp.y + indexMcp.y + pinkyMcp.y) / 4,
    z: (wrist.z + middleMcp.z + indexMcp.z + pinkyMcp.z) / 4
  };

  // Local orthonormal palm coordinate frame
  const vIndex = sub3D(geoPts[5], geoWrist);
  const vPinky = sub3D(geoPts[17], geoWrist);
  const palmUpVector = normalize3D(sub3D(geoMiddleMcp, geoWrist));

  // Cross product gives palm normal; handedness flips chirality
  let rawNormal = cross3D(vIndex, vPinky);
  if (handedness === 'Right') {
    rawNormal = scale3D(rawNormal, -1);
  }
  const palmNormal = normalize3D(rawNormal);
  const palmRightVector = normalize3D(cross3D(palmUpVector, palmNormal));

  const handRollDeg = (Math.atan2(palmUpVector.x, -palmUpVector.y) * 180) / Math.PI;
  const handPitchDeg = (Math.asin(Math.max(-1, Math.min(1, -palmUpVector.z))) * 180) / Math.PI;
  const palmFacing = classifyPalmFacing(palmNormal, handedness);

  // 3D Joint angles & continuous extension scores for all 5 fingers
  const thumb = computeFingerAngles(
    geoWrist,
    geoPts[1],
    geoPts[2],
    geoPts[3],
    geoPts[3],
    geoPts[4],
    geoPalmScale,
    true
  );
  // Adjust thumb extension to also measure abduction away from index MCP & pinky MCP
  const thumbToPinky = dist3D(geoPts[4], geoPts[17]) / geoPalmScale;
  const thumbToIndexMcp = dist3D(geoPts[4], geoPts[5]) / geoPalmScale;
  const thumbAbduction = clamp01((thumbToPinky - 0.65) / 0.6) * 0.5 + clamp01((thumbToIndexMcp - 0.38) / 0.42) * 0.5;
  thumb.extensionScore = clamp01(thumb.extensionScore * 0.5 + thumbAbduction * 0.5);
  thumb.curlScore = 1 - thumb.extensionScore;

  const index = computeFingerAngles(geoWrist, geoWrist, geoPts[5], geoPts[6], geoPts[7], geoPts[8], geoPalmScale);
  const middle = computeFingerAngles(geoWrist, geoWrist, geoPts[9], geoPts[10], geoPts[11], geoPts[12], geoPalmScale);
  const ring = computeFingerAngles(geoWrist, geoWrist, geoPts[13], geoPts[14], geoPts[15], geoPts[16], geoPalmScale);
  const pinky = computeFingerAngles(geoWrist, geoWrist, geoPts[17], geoPts[18], geoPts[19], geoPts[20], geoPalmScale);

  // Inter-finger abduction/spread angles
  const thumbVec = sub3D(geoPts[4], geoPts[2]);
  const indexVec = sub3D(geoPts[8], geoPts[5]);
  const middleVec = sub3D(geoPts[12], geoPts[9]);
  const ringVec = sub3D(geoPts[16], geoPts[13]);
  const pinkyVec = sub3D(geoPts[20], geoPts[17]);

  const spreadAnglesDeg = {
    thumbIndex: angleBetweenDeg(thumbVec, indexVec),
    indexMiddle: angleBetweenDeg(indexVec, middleVec),
    middleRing: angleBetweenDeg(middleVec, ringVec),
    ringPinky: angleBetweenDeg(ringVec, pinkyVec)
  };

  const normalizedTipDistances = {
    thumbToIndexTip: dist3D(geoPts[4], geoPts[8]) / geoPalmScale,
    thumbToMiddleTip: dist3D(geoPts[4], geoPts[12]) / geoPalmScale,
    thumbToPinkyMcp: thumbToPinky,
    thumbToIndexMcp,
    indexToMiddleTip: dist3D(geoPts[8], geoPts[12]) / geoPalmScale
  };

  const averageFingerOpenness =
    (index.extensionScore + middle.extensionScore + ring.extensionScore + pinky.extensionScore) / 4;

  const handshapeVector = [
    thumb.extensionScore,
    index.extensionScore,
    middle.extensionScore,
    ring.extensionScore,
    pinky.extensionScore,
    clamp01(1 - normalizedTipDistances.thumbToIndexTip),
    clamp01(spreadAnglesDeg.indexMiddle / 45)
  ];

  return {
    handedness,
    landmarks: pts,
    wristRelative,
    palmScale,
    palmWidth,
    handCenter,
    palmNormal,
    palmUpVector,
    palmRightVector,
    palmFacing,
    handRollDeg,
    handPitchDeg,
    fingers: { thumb, index, middle, ring, pinky },
    spreadAnglesDeg,
    normalizedTipDistances,
    averageFingerOpenness,
    handshapeVector
  };
}

function classifyHandBodyZone(
  handCenter: Point3D,
  body: Omit<BodyContextFeatures, 'leftHandZone' | 'rightHandZone' | 'leftHandBodyRelative' | 'rightHandBodyRelative'>
): BodyZone {
  const { bodyScale, torsoHeight, foreheadEstimate, nose, mouthMid, chinEstimate, leftEar, rightEar, chestCenter, shoulderMid } =
    body;

  // Check anatomical proximity in bodyScale-normalized coordinates
  const dForehead = dist2D(handCenter, foreheadEstimate) / bodyScale;
  const dEar = Math.min(dist2D(handCenter, leftEar), dist2D(handCenter, rightEar)) / bodyScale;
  const dMouth = dist2D(handCenter, mouthMid) / bodyScale;
  const dChin = dist2D(handCenter, chinEstimate) / bodyScale;
  const dChest = dist2D(handCenter, chestCenter) / bodyScale;

  // Temple is lateral to forehead/nose above ear level
  if (handCenter.y <= nose.y + 0.05 * torsoHeight) {
    if (dEar < 0.36) return 'ear';
    if (dForehead < 0.38) return 'forehead';
    if (Math.abs(handCenter.x - nose.x) > 0.22 * bodyScale && Math.abs(handCenter.x - nose.x) < 0.72 * bodyScale) {
      return 'temple';
    }
    if (handCenter.y < shoulderMid.y - 0.1 * torsoHeight) {
      return 'above_shoulder';
    }
  }

  if (dMouth < 0.32) return 'nose_mouth';
  if (dChin < 0.34) return 'chin';
  if (dEar < 0.34) return 'ear';

  if (handCenter.y < shoulderMid.y - 0.05 * torsoHeight) {
    return 'above_shoulder';
  }

  if (handCenter.y > shoulderMid.y + torsoHeight * 0.95) {
    return 'waist_low';
  }

  if (dChest < 0.42) {
    return 'chest';
  }

  if (handCenter.y >= shoulderMid.y - 0.15 * torsoHeight && handCenter.y <= shoulderMid.y + 0.15 * torsoHeight) {
    return Math.abs(handCenter.x - shoulderMid.x) > 0.45 * bodyScale ? 'neck_shoulder' : 'chest';
  }

  return 'neutral_space';
}

export function extractBodyContext(
  poseLandmarks?: { x: number; y: number; z?: number }[],
  hands: HandGeometryFeatures[] = []
): BodyContextFeatures {
  if (!poseLandmarks || poseLandmarks.length < 25) {
    const defaultShoulderMid: Point3D = { x: 0.5, y: 0.46, z: 0 };
    const defaultScale = 0.28;
    const base = {
      detected: false,
      bodyScale: defaultScale,
      torsoHeight: 0.36,
      shoulderMid: defaultShoulderMid,
      hipMid: { x: 0.5, y: 0.82, z: 0 },
      nose: { x: 0.5, y: 0.27, z: 0 },
      chinEstimate: { x: 0.5, y: 0.35, z: 0 },
      leftEar: { x: 0.59, y: 0.27, z: 0 },
      rightEar: { x: 0.41, y: 0.27, z: 0 },
      mouthMid: { x: 0.5, y: 0.31, z: 0 },
      foreheadEstimate: { x: 0.5, y: 0.19, z: 0 },
      chestCenter: { x: 0.5, y: 0.56, z: 0 },
      leftShoulder: { x: 0.64, y: 0.46, z: 0 },
      rightShoulder: { x: 0.36, y: 0.46, z: 0 },
      trunkLeanDeg: 0
    };

    const primary = hands[0];
    const secondary = hands[1];
    return {
      ...base,
      leftHandZone: primary ? classifyHandBodyZone(primary.handCenter, base) : null,
      rightHandZone: secondary ? classifyHandBodyZone(secondary.handCenter, base) : null,
      leftHandBodyRelative: primary
        ? scale3D(sub3D(primary.handCenter, defaultShoulderMid), 1 / defaultScale)
        : null,
      rightHandBodyRelative: secondary
        ? scale3D(sub3D(secondary.handCenter, defaultShoulderMid), 1 / defaultScale)
        : null
    };
  }

  const nose = toPoint3D(poseLandmarks[0]);
  const leftEar = toPoint3D(poseLandmarks[7]);
  const rightEar = toPoint3D(poseLandmarks[8]);
  const mouthLeft = toPoint3D(poseLandmarks[9]);
  const mouthRight = toPoint3D(poseLandmarks[10]);
  const leftShoulder = toPoint3D(poseLandmarks[11]);
  const rightShoulder = toPoint3D(poseLandmarks[12]);
  const leftElbow = poseLandmarks[13] ? toPoint3D(poseLandmarks[13]) : undefined;
  const rightElbow = poseLandmarks[14] ? toPoint3D(poseLandmarks[14]) : undefined;
  const leftHip = toPoint3D(poseLandmarks[23]);
  const rightHip = toPoint3D(poseLandmarks[24]);

  const bodyScale = Math.max(0.12, dist2D(leftShoulder, rightShoulder));
  const shoulderMid: Point3D = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2
  };
  const hipMid: Point3D = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2
  };
  const torsoHeight = Math.max(0.18, dist2D(shoulderMid, hipMid));

  const mouthMid: Point3D = {
    x: (mouthLeft.x + mouthRight.x) / 2,
    y: (mouthLeft.y + mouthRight.y) / 2,
    z: (mouthLeft.z + mouthRight.z) / 2
  };

  const headSpan = Math.max(0.06, Math.abs(shoulderMid.y - nose.y));
  const chinEstimate: Point3D = {
    x: mouthMid.x,
    y: mouthMid.y + headSpan * 0.25,
    z: mouthMid.z
  };
  const foreheadEstimate: Point3D = {
    x: nose.x,
    y: nose.y - headSpan * 0.42,
    z: nose.z
  };
  const chestCenter: Point3D = {
    x: shoulderMid.x,
    y: shoulderMid.y + torsoHeight * 0.28,
    z: shoulderMid.z
  };

  const trunkLeanDeg = (Math.atan2(shoulderMid.x - hipMid.x, hipMid.y - shoulderMid.y) * 180) / Math.PI;

  const base = {
    detected: true,
    bodyScale,
    torsoHeight,
    shoulderMid,
    hipMid,
    nose,
    chinEstimate,
    leftEar,
    rightEar,
    mouthMid,
    foreheadEstimate,
    chestCenter,
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    trunkLeanDeg
  };

  const leftHand = hands.find((h) => h.handedness === 'Left') ?? hands[0];
  const rightHand = hands.find((h) => h.handedness === 'Right') ?? (hands.length > 1 ? hands[1] : undefined);

  return {
    ...base,
    leftHandZone: leftHand ? classifyHandBodyZone(leftHand.handCenter, base) : null,
    rightHandZone: rightHand ? classifyHandBodyZone(rightHand.handCenter, base) : null,
    leftHandBodyRelative: leftHand ? scale3D(sub3D(leftHand.handCenter, shoulderMid), 1 / bodyScale) : null,
    rightHandBodyRelative: rightHand ? scale3D(sub3D(rightHand.handCenter, shoulderMid), 1 / bodyScale) : null
  };
}

export function extractFaceExpressions(
  faceLandmarks?: { x: number; y: number; z?: number }[],
  faceBlendshapes?: { categories?: { categoryName: string; score: number }[] }[]
): FaceExpressionFeatures {
  if (!faceLandmarks || faceLandmarks.length < 400) {
    return {
      detected: false,
      browRaiseScore: 0,
      browFurrowScore: 0,
      eyeOpenness: 0.8,
      mouthOpenScore: 0,
      smileScore: 0,
      headYawDeg: 0,
      headPitchDeg: 0,
      headRollDeg: 0,
      detectedNmf: 'neutral'
    };
  }

  // Prefer official MediaPipe blendshapes when present
  const bsMap = new Map<string, number>();
  const categories = faceBlendshapes?.[0]?.categories ?? [];
  for (const cat of categories) {
    bsMap.set(cat.categoryName, cat.score);
  }

  // Canonical MediaPipe FaceMesh indices
  const noseTip = faceLandmarks[1];
  const leftCheek = faceLandmarks[234];
  const rightCheek = faceLandmarks[454];
  const foreheadTop = faceLandmarks[10];
  const chinBottom = faceLandmarks[152];
  const leftEyeOuter = faceLandmarks[33];
  const rightEyeOuter = faceLandmarks[263];
  const leftBrowMid = faceLandmarks[105];
  const leftEyeUpper = faceLandmarks[159];
  const leftEyeLower = faceLandmarks[145];
  const upperLip = faceLandmarks[13];
  const lowerLip = faceLandmarks[14];
  const mouthLeftCorner = faceLandmarks[61];
  const mouthRightCorner = faceLandmarks[291];

  const faceHeight = Math.max(0.05, dist2D(foreheadTop, chinBottom));
  const faceWidth = Math.max(0.05, dist2D(leftCheek, rightCheek));

  const browDist = Math.abs(leftEyeUpper.y - leftBrowMid.y) / faceHeight;
  const geomBrowRaise = clamp01((browDist - 0.08) / 0.06);
  const geomBrowFurrow = clamp01((0.075 - browDist) / 0.035);

  const eyeHeight = Math.abs(leftEyeLower.y - leftEyeUpper.y) / faceHeight;
  const eyeOpenness = clamp01(eyeHeight / 0.055);

  const mouthGap = Math.abs(lowerLip.y - upperLip.y) / faceHeight;
  const mouthWidth = dist2D(mouthLeftCorner, mouthRightCorner) / faceWidth;
  const geomMouthOpen = clamp01((mouthGap - 0.02) / 0.14);
  const geomSmile = clamp01((mouthWidth - 0.36) / 0.14);

  const browRaiseScore = bsMap.size > 0
    ? clamp01(((bsMap.get('browInnerUp') ?? 0) + (bsMap.get('browOuterUpLeft') ?? 0) + (bsMap.get('browOuterUpRight') ?? 0)) / 1.8)
    : geomBrowRaise;

  const browFurrowScore = bsMap.size > 0
    ? clamp01(((bsMap.get('browDownLeft') ?? 0) + (bsMap.get('browDownRight') ?? 0)) / 1.4)
    : geomBrowFurrow;

  const mouthOpenScore = bsMap.size > 0 ? clamp01(bsMap.get('jawOpen') ?? geomMouthOpen) : geomMouthOpen;
  const smileScore = bsMap.size > 0
    ? clamp01(((bsMap.get('mouthSmileLeft') ?? 0) + (bsMap.get('mouthSmileRight') ?? 0)) / 1.4)
    : geomSmile;

  // Head orientation estimates (Yaw, Pitch, Roll)
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const faceCenterY = (foreheadTop.y + chinBottom.y) / 2;
  const headYawDeg = ((noseTip.x - faceCenterX) / faceWidth) * 90;
  const headPitchDeg = ((noseTip.y - faceCenterY) / faceHeight) * 70;
  const headRollDeg = (Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * 180) / Math.PI;

  let detectedNmf: NmfExpressionType = 'neutral';
  if (browRaiseScore > 0.45) {
    detectedNmf = 'interrogative_brows_up';
  } else if (browFurrowScore > 0.42) {
    detectedNmf = 'wh_brows_furrowed';
  } else if (smileScore > 0.45) {
    detectedNmf = 'positive_smile';
  }

  return {
    detected: true,
    browRaiseScore,
    browFurrowScore,
    eyeOpenness,
    mouthOpenScore,
    smileScore,
    headYawDeg,
    headPitchDeg,
    headRollDeg,
    detectedNmf
  };
}
