import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractBodyContext,
  extractFaceExpressions,
  extractHandGeometry
} from '../services/multimodalGeometry';
import {
  computeDtwTrajectorySimilarity,
  TemporalMotionBuffer
} from '../services/temporalAnalyzer';
import {
  buildTranslationOutput,
  evaluateMultimodalLibrasSign
} from '../services/librasTranslatorService';
import {
  createInitialHoldState,
  stepHoldToConfirm
} from '../services/holdToConfirm';
import { LIBRAS_SIGN_DATABASE } from '../data/librasSignDatabase';
import {
  HandednessLabel,
  MultimodalFrameSnapshot,
  PalmFacing,
  Point3D
} from '../types/librasRecognition';

// ============================================================================
// Biomechanical 3D Synthetic Landmark Generator
// ============================================================================

interface FingerCurlSpec {
  thumb: number; // 0 = curled, 1 = straight
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  indexSpreadDeg?: number;
  thumbSpreadDeg?: number;
  thumbCrossInward?: boolean;
  indexForwardZ?: number; // Override 3D index vector Z (e.g. pointing EU vs VOCE)
}

function rotateVectorForFacing(local: Point3D, facing: PalmFacing, handedness: HandednessLabel): Point3D {
  // Base local hand: palm points in -Z (toward camera), fingers extend in -Y (up),
  // thumb is on +X for Right hand (from viewer mirror? Let's verify cross3D(vIndex, vPinky)).
  // Wait: in multimodalGeometry.ts:
  // rawNormal = cross3D(vIndex, vPinky)
  // if (handedness === 'Right') rawNormal = -rawNormal
  // For Right hand: if vIndex = (-0.3, -1, 0), vPinky = (0.3, -1, 0):
  // cross(vIndex, vPinky) = (0, 0, (-0.3)*(-1) - (-1)*(0.3)) = (0, 0, +0.6)
  // After Right flip: (0, 0, -0.6) -> negative Z = 'camera'!
  // So for Right hand with fingers up (-Y): index at -X, pinky at +X gives palm normal = 'camera'.
  // For Left hand with fingers up (-Y): index at +X, pinky at -X gives cross = (0, 0, -0.6) -> 'camera'.
  const { x, y, z } = local;
  switch (facing) {
    case 'camera':
      return { x, y, z };
    case 'signer':
      // Rotate 180° around Y axis: x -> -x, z -> -z
      return { x: -x, y, z: -z };
    case 'up':
      // Rotate -90° around X axis: (0,0,-1) -> (0,-1,0) ('up'), det = +1
      return { x, y: z, z: -y };
    case 'down':
      // Rotate +90° around X axis: (0,0,-1) -> (0,+1,0) ('down'), det = +1
      return { x, y: -z, z: y };
    case 'inward':
      // Right hand normal should point +X ('inward'), Left hand normal should point -X ('inward')
      if (handedness === 'Right') {
        // Rotate (0,0,-1) to (+1,0,0): rotate -90° around Y -> x' = -z, z' = x
        return { x: -z, y, z: x };
      }
      // Left hand: rotate (0,0,-1) to (-1,0,0): rotate +90° around Y -> x' = z, z' = -x
      return { x: z, y, z: -x };
    case 'outward':
      if (handedness === 'Right') {
        return { x: z, y, z: -x };
      }
      return { x: -z, y, z: x };
    default:
      return { x, y, z };
  }
}

function buildArticulatedFinger(
  mcp: Point3D,
  dirUp: Point3D,
  palmNormal: Point3D,
  extension: number,
  palmScale: number,
  lengthFactor: number
): [Point3D, Point3D, Point3D] {
  // Curl bends segments toward the palm normal direction (inward flexion)
  // At extension=1: segments align with dirUp (180° joints).
  // At extension=0: segments flex 85°-105° each toward palmNormal.
  const seg1Len = palmScale * 0.34 * lengthFactor;
  const seg2Len = palmScale * 0.24 * lengthFactor;
  const seg3Len = palmScale * 0.20 * lengthFactor;

  const bend1 = (1 - extension) * 1.45; // radians (~83° MCP bend)
  const bend2 = (1 - extension) * 2.95; // (~86° PIP bend)
  const bend3 = (1 - extension) * 4.35; // (~80° DIP bend)

  const step = (origin: Point3D, angle: number, len: number): Point3D => ({
    x: origin.x + (dirUp.x * Math.cos(angle) + palmNormal.x * Math.sin(angle)) * len,
    y: origin.y + (dirUp.y * Math.cos(angle) + palmNormal.y * Math.sin(angle)) * len,
    z: origin.z + (dirUp.z * Math.cos(angle) + palmNormal.z * Math.sin(angle)) * len
  });

  const pip = step(mcp, bend1, seg1Len);
  const dip = step(pip, bend2, seg2Len);
  const tip = step(dip, bend3, seg3Len);
  return [pip, dip, tip];
}

function generateSyntheticHand(opts: {
  wristPos: Point3D;
  palmScale: number;
  facing: PalmFacing;
  handedness: HandednessLabel;
  spec: FingerCurlSpec;
  noiseStd?: number;
}): Point3D[] {
  const { wristPos, palmScale, facing, handedness, spec, noiseStd = 0 } = opts;
  const sideSign = handedness === 'Right' ? -1 : 1; // Right hand index on -X side when facing camera

  const xf = (lx: number, ly: number, lz = 0): Point3D => {
    const r = rotateVectorForFacing(
      { x: lx * palmScale, y: ly * palmScale, z: lz * palmScale },
      facing,
      handedness
    );
    return {
      x: wristPos.x + r.x,
      y: wristPos.y + r.y,
      z: wristPos.z + r.z
    };
  };

  const wrist = { ...wristPos };
  const indexMcp = xf(sideSign * 0.34, -0.92, 0);
  const middleMcp = xf(sideSign * 0.08, -1.0, 0);
  const ringMcp = xf(-sideSign * 0.16, -0.96, 0);
  const pinkyMcp = xf(-sideSign * 0.38, -0.88, 0);

  // Palm normal direction in world coords
  const palmDir = rotateVectorForFacing({ x: 0, y: 0, z: -1 }, facing, handedness);
  const spreadRad = ((spec.indexSpreadDeg ?? 6) * Math.PI) / 180;

  const indexUp = rotateVectorForFacing(
    { x: Math.sin(spreadRad) * sideSign, y: -Math.cos(spreadRad), z: 0 },
    facing,
    handedness
  );
  const middleUp = rotateVectorForFacing(
    { x: -Math.sin(spreadRad * 0.4) * sideSign, y: -Math.cos(spreadRad * 0.4), z: 0 },
    facing,
    handedness
  );
  const ringUp = rotateVectorForFacing(
    { x: -sideSign * 0.08, y: -0.99, z: 0 },
    facing,
    handedness
  );
  const pinkyUp = rotateVectorForFacing(
    { x: -sideSign * 0.16, y: -0.98, z: 0 },
    facing,
    handedness
  );

  const [idxPip, idxDip, idxTipRaw] = buildArticulatedFinger(
    indexMcp,
    indexUp,
    palmDir,
    spec.index,
    palmScale,
    1.0
  );
  const [midPip, midDip, midTip] = buildArticulatedFinger(
    middleMcp,
    middleUp,
    palmDir,
    spec.middle,
    palmScale,
    1.08
  );
  const [rngPip, rngDip, rngTip] = buildArticulatedFinger(
    ringMcp,
    ringUp,
    palmDir,
    spec.ring,
    palmScale,
    1.0
  );
  const [pnkPip, pnkDip, pnkTip] = buildArticulatedFinger(
    pinkyMcp,
    pinkyUp,
    palmDir,
    spec.pinky,
    palmScale,
    0.82
  );

  // Optional explicit 3D pointing vector override for index finger (keeps finger straight while pointing toward Z)
  let finalIdxPip = idxPip;
  let finalIdxDip = idxDip;
  let finalIdxTip = idxTipRaw;
  if (spec.indexForwardZ !== undefined) {
    const dir = { x: 0, y: -0.25, z: spec.indexForwardZ };
    const len = Math.hypot(dir.x, dir.y, dir.z);
    const u = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
    finalIdxPip = {
      x: indexMcp.x + u.x * palmScale * 0.34,
      y: indexMcp.y + u.y * palmScale * 0.34,
      z: indexMcp.z + u.z * palmScale * 0.34
    };
    finalIdxDip = {
      x: finalIdxPip.x + u.x * palmScale * 0.24,
      y: finalIdxPip.y + u.y * palmScale * 0.24,
      z: finalIdxPip.z + u.z * palmScale * 0.24
    };
    finalIdxTip = {
      x: finalIdxDip.x + u.x * palmScale * 0.22,
      y: finalIdxDip.y + u.y * palmScale * 0.22,
      z: finalIdxDip.z + u.z * palmScale * 0.22
    };
  }

  // Thumb geometry
  const thumbCmc = xf(sideSign * 0.32, -0.30, -0.04);
  const thumbMcp = xf(sideSign * 0.56, -0.52, -0.06);
  const thumbAngleRad = ((spec.thumbSpreadDeg ?? 48) * Math.PI) / 180;
  let thumbDirLocal: Point3D;
  if (spec.thumbCrossInward) {
    // Tucked across palm (curl)
    thumbDirLocal = { x: -sideSign * 0.65, y: -0.45, z: -0.55 };
  } else if (spec.thumb >= 0.7) {
    thumbDirLocal = {
      x: sideSign * Math.sin(thumbAngleRad),
      y: -Math.cos(thumbAngleRad),
      z: -0.05
    };
  } else {
    // Pinch / curled thumb near index tip/mid
    thumbDirLocal = { x: sideSign * 0.15, y: -0.82, z: -0.5 };
  }
  const tLen = Math.hypot(thumbDirLocal.x, thumbDirLocal.y, thumbDirLocal.z);
  const thumbUnit = rotateVectorForFacing(
    { x: thumbDirLocal.x / tLen, y: thumbDirLocal.y / tLen, z: thumbDirLocal.z / tLen },
    facing,
    handedness
  );
  const thumbIp: Point3D = {
    x: thumbMcp.x + thumbUnit.x * palmScale * 0.28,
    y: thumbMcp.y + thumbUnit.y * palmScale * 0.28,
    z: thumbMcp.z + thumbUnit.z * palmScale * 0.28
  };
  const thumbTip: Point3D = {
    x: thumbIp.x + thumbUnit.x * palmScale * (0.18 + spec.thumb * 0.14),
    y: thumbIp.y + thumbUnit.y * palmScale * (0.18 + spec.thumb * 0.14),
    z: thumbIp.z + thumbUnit.z * palmScale * (0.18 + spec.thumb * 0.14)
  };

  const landmarks = [
    wrist,
    thumbCmc,
    thumbMcp,
    thumbIp,
    thumbTip,
    indexMcp,
    finalIdxPip,
    finalIdxDip,
    finalIdxTip,
    middleMcp,
    midPip,
    midDip,
    midTip,
    ringMcp,
    rngPip,
    rngDip,
    rngTip,
    pinkyMcp,
    pnkPip,
    pnkDip,
    pnkTip
  ];

  if (noiseStd > 0) {
    // Deterministic pseudo-noise based on index for reproducible tests
    return landmarks.map((p, idx) => ({
      x: p.x + Math.sin(idx * 17.3) * noiseStd,
      y: p.y + Math.cos(idx * 23.1) * noiseStd,
      z: p.z + Math.sin(idx * 31.7) * noiseStd
    }));
  }
  return landmarks;
}

function generateSyntheticPose(opts: {
  shoulderMid?: Point3D;
  bodyScale?: number;
}): Point3D[] {
  const sMid = opts.shoulderMid ?? { x: 0.5, y: 0.46, z: 0 };
  const bs = opts.bodyScale ?? 0.28;
  const torsoH = bs * 1.28;
  const headH = bs * 0.68;

  const pose: Point3D[] = Array.from({ length: 33 }, () => ({ ...sMid }));
  pose[0] = { x: sMid.x, y: sMid.y - headH, z: 0 }; // nose
  pose[7] = { x: sMid.x + bs * 0.32, y: sMid.y - headH, z: 0 }; // left ear
  pose[8] = { x: sMid.x - bs * 0.32, y: sMid.y - headH, z: 0 }; // right ear
  pose[9] = { x: sMid.x + bs * 0.08, y: sMid.y - headH * 0.78, z: 0 }; // mouth left
  pose[10] = { x: sMid.x - bs * 0.08, y: sMid.y - headH * 0.78, z: 0 }; // mouth right
  pose[11] = { x: sMid.x + bs * 0.5, y: sMid.y, z: 0 }; // left shoulder
  pose[12] = { x: sMid.x - bs * 0.5, y: sMid.y, z: 0 }; // right shoulder
  pose[23] = { x: sMid.x + bs * 0.36, y: sMid.y + torsoH, z: 0 }; // left hip
  pose[24] = { x: sMid.x - bs * 0.36, y: sMid.y + torsoH, z: 0 }; // right hip
  return pose;
}

function generateSyntheticFace(opts?: {
  center?: Point3D;
  faceScale?: number;
  yawDeg?: number;
  pitchDeg?: number;
  browRaise?: boolean;
  browFurrow?: boolean;
  smile?: boolean;
}): Point3D[] {
  const c = opts?.center ?? { x: 0.5, y: 0.27, z: 0 };
  const fs = opts?.faceScale ?? 0.16;
  const face: Point3D[] = Array.from({ length: 468 }, () => ({ ...c }));

  face[10] = { x: c.x, y: c.y - fs * 0.55, z: 0 }; // foreheadTop
  face[152] = { x: c.x, y: c.y + fs * 0.55, z: 0 }; // chinBottom
  face[234] = { x: c.x - fs * 0.42, y: c.y, z: 0 }; // leftCheek
  face[454] = { x: c.x + fs * 0.42, y: c.y, z: 0 }; // rightCheek

  const yawOffset = ((opts?.yawDeg ?? 0) / 90) * (fs * 0.84);
  const pitchOffset = ((opts?.pitchDeg ?? 0) / 70) * (fs * 1.1);
  face[1] = { x: c.x + yawOffset, y: c.y + pitchOffset, z: -0.04 }; // noseTip

  face[33] = { x: c.x - fs * 0.18, y: c.y - fs * 0.08, z: 0 };
  face[263] = { x: c.x + fs * 0.18, y: c.y - fs * 0.08, z: 0 };

  face[159] = { x: c.x - fs * 0.18, y: c.y - fs * 0.10, z: 0 }; // leftEyeUpper
  face[145] = { x: c.x - fs * 0.18, y: c.y - fs * 0.05, z: 0 }; // leftEyeLower
  const browLift = opts?.browRaise ? fs * 0.15 : opts?.browFurrow ? fs * 0.05 : fs * 0.095;
  face[105] = { x: c.x - fs * 0.18, y: face[159].y - browLift, z: 0 };

  face[13] = { x: c.x, y: c.y + fs * 0.22, z: 0 };
  face[14] = { x: c.x, y: c.y + fs * 0.24, z: 0 };
  const smileW = opts?.smile ? fs * 0.46 : fs * 0.30;
  face[61] = { x: c.x - smileW * 0.5, y: c.y + fs * 0.23, z: 0 };
  face[291] = { x: c.x + smileW * 0.5, y: c.y + fs * 0.23, z: 0 };

  return face;
}

function makeSnapshot(opts: {
  timestampMs: number;
  bodyScale?: number;
  hands: {
    wristOffsetBodyNorm: Point3D;
    facing: PalmFacing;
    handedness: HandednessLabel;
    spec: FingerCurlSpec;
  }[];
  faceOpts?: Parameters<typeof generateSyntheticFace>[0];
  noiseStd?: number;
}): MultimodalFrameSnapshot {
  const bodyScale = opts.bodyScale ?? 0.28;
  const shoulderMid = { x: 0.5, y: 0.46, z: 0 };
  const palmScale = bodyScale * 0.34;
  const poseLm = generateSyntheticPose({ shoulderMid, bodyScale });
  const faceLm = generateSyntheticFace({
    center: poseLm[0],
    faceScale: bodyScale * 0.56,
    ...opts.faceOpts
  });

  const handGeos = opts.hands.map((h) => {
    const wristPos: Point3D = {
      x: shoulderMid.x + h.wristOffsetBodyNorm.x * bodyScale,
      y: shoulderMid.y + h.wristOffsetBodyNorm.y * bodyScale,
      z: shoulderMid.z + h.wristOffsetBodyNorm.z * bodyScale
    };
    const lms = generateSyntheticHand({
      wristPos,
      palmScale,
      facing: h.facing,
      handedness: h.handedness,
      spec: h.spec,
      noiseStd: opts.noiseStd ?? 0
    });
    return extractHandGeometry(lms, h.handedness);
  });

  return {
    timestampMs: opts.timestampMs,
    hands: handGeos,
    body: extractBodyContext(poseLm, handGeos),
    face: extractFaceExpressions(faceLm)
  };
}

/**
 * Produces a 12-frame buffer for any validated sign, scaled to arbitrary camera distance & speed.
 */
function simulateValidatedSignBuffer(
  signId: string,
  options: {
    bodyScale?: number;
    speedMultiplier?: number; // 0.5 = slow, 1.0 = normal, 2.0 = fast
    noiseStd?: number;
    frameCount?: number;
  } = {}
): TemporalMotionBuffer {
  const frameCount = options.frameCount ?? 14;
  const dtMs = Math.round(50 / (options.speedMultiplier ?? 1));
  const buffer = new TemporalMotionBuffer(36, 2500);

  for (let i = 0; i < frameCount; i++) {
    const tNorm = frameCount > 1 ? i / (frameCount - 1) : 0;
    const tMs = i * dtMs;

    let hands: Parameters<typeof makeSnapshot>[0]['hands'] = [];
    let faceOpts: Parameters<typeof makeSnapshot>[0]['faceOpts'] = undefined;

    switch (signId) {
      case 'tudo_bem':
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.05, y: 0.42, z: -0.05 },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0, thumbSpreadDeg: 62 }
          }
        ];
        break;
      case 'amor':
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.05, y: 0.42, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 1, thumbSpreadDeg: 55 }
          }
        ];
        break;
      case 'paz':
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.05, y: 0.42, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: {
              thumb: 0,
              index: 1,
              middle: 1,
              ring: 0,
              pinky: 0,
              indexSpreadDeg: 24,
              thumbCrossInward: true
            }
          }
        ];
        break;
      case 'oi': {
        const waveX = Math.sin(tNorm * Math.PI * 2.5) * 0.18;
        hands = [
          {
            wristOffsetBodyNorm: { x: -0.68 + waveX, y: -0.15, z: -0.04 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 14 }
          }
        ];
        break;
      }
      case 'obrigado':
        hands = [
          {
            wristOffsetBodyNorm: {
              x: 0.0,
              y: -0.58 + tNorm * 0.28,
              z: 0.05 - tNorm * 0.35
            },
            facing: 'signer',
            handedness: 'Right',
            spec: { thumb: 0.35, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
          }
        ];
        break;
      case 'por_favor':
        hands = [
          {
            wristOffsetBodyNorm: { x: -0.06, y: 0.45, z: -0.05 },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 4 }
          },
          {
            wristOffsetBodyNorm: { x: 0.06, y: 0.45, z: -0.05 },
            facing: 'inward',
            handedness: 'Left',
            spec: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 4 }
          }
        ];
        break;
      case 'casa':
        hands = [
          {
            wristOffsetBodyNorm: { x: -0.24, y: 0.42, z: -0.05 },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 0.7, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 4 }
          },
          {
            wristOffsetBodyNorm: { x: 0.24, y: 0.42, z: -0.05 },
            facing: 'inward',
            handedness: 'Left',
            spec: { thumb: 0.7, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 4 }
          }
        ];
        // Tilt wrists inward so fingertips meet near top (tipDist < 0.95) while wrists stay apart (> 1.3 palmScale)!
        // Let's apply explicit slight tilt via custom post-processing below if needed; let's handle 'casa' cleanly.
        break;
      case 'ajudar':
        hands = [
          {
            wristOffsetBodyNorm: { x: -0.08, y: 0.48, z: -0.05 },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 0.65, index: 0, middle: 0, ring: 0, pinky: 0, thumbSpreadDeg: 35 }
          },
          {
            wristOffsetBodyNorm: { x: 0.08, y: 0.55, z: -0.05 },
            facing: 'up',
            handedness: 'Left',
            spec: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 6 }
          }
        ];
        break;
      case 'libras': {
        const yRight = 0.4 + Math.sin(tNorm * Math.PI * 2.5) * 0.18;
        const yLeft = 0.4 - Math.sin(tNorm * Math.PI * 2.5) * 0.18;
        hands = [
          {
            wristOffsetBodyNorm: { x: -0.28, y: yRight, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 14 }
          },
          {
            wristOffsetBodyNorm: { x: 0.28, y: yLeft, z: -0.05 },
            facing: 'camera',
            handedness: 'Left',
            spec: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 14 }
          }
        ];
        break;
      }
      case 'eu':
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.02, y: 0.48, z: -0.08 },
            facing: 'signer',
            handedness: 'Right',
            spec: {
              thumb: 0,
              index: 1,
              middle: 0,
              ring: 0,
              pinky: 0,
              thumbCrossInward: true,
              indexForwardZ: 0.95 // Points straight toward signer body (+Z)
            }
          }
        ];
        break;
      case 'voce':
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.0, y: 0.56, z: -0.1 },
            facing: 'down',
            handedness: 'Right',
            spec: {
              thumb: 0,
              index: 1,
              middle: 0,
              ring: 0,
              pinky: 0,
              thumbCrossInward: true,
              indexForwardZ: -0.95 // Points straight toward camera (-Z)
            }
          }
        ];
        break;
      case 'nao': {
        const shakeX = Math.sin(tNorm * Math.PI * 2.5) * 0.16;
        hands = [
          {
            wristOffsetBodyNorm: { x: -0.62 + shakeX, y: -0.02, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
          }
        ];
        faceOpts = { yawDeg: Math.sin(tNorm * Math.PI * 2.5) * 16 };
        break;
      }
      case 'sim': {
        const nodY = Math.sin(tNorm * Math.PI * 2.5) * 0.16;
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.05, y: 0.45 + nodY, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
          }
        ];
        faceOpts = { pitchDeg: Math.sin(tNorm * Math.PI * 2.5) * 12 };
        break;
      }
      case 'agua':
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.02, y: -0.24, z: -0.04 },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0, thumbSpreadDeg: 75 }
          }
        ];
        break;
      case 'comer': {
        const zOsc = -0.08 + Math.sin(tNorm * Math.PI * 2.5) * 0.12;
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.0, y: -0.30, z: zOsc },
            facing: 'signer',
            handedness: 'Right',
            spec: { thumb: 0.45, index: 0.35, middle: 0.35, ring: 0.25, pinky: 0.2 }
          }
        ];
        break;
      }
      case 'gostar': {
        const theta = tNorm * Math.PI * 2;
        hands = [
          {
            wristOffsetBodyNorm: {
              x: Math.sin(theta) * 0.16,
              y: 0.46 + Math.cos(theta) * 0.12,
              z: -0.03
            },
            facing: 'signer',
            handedness: 'Right',
            spec: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 10 }
          }
        ];
        break;
      }
      case 'saber':
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.24, y: -0.58, z: -0.04 },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
          }
        ];
        break;
      case 'aprender': {
        const openLevel = Math.max(0.05, 0.82 - tNorm * 0.72);
        hands = [
          {
            wristOffsetBodyNorm: { x: 0.0, y: -0.60, z: -0.04 },
            facing: 'signer',
            handedness: 'Right',
            spec: {
              thumb: openLevel * 0.9,
              index: openLevel,
              middle: openLevel,
              ring: openLevel,
              pinky: openLevel,
              indexSpreadDeg: 8
            }
          }
        ];
        break;
      }
      case 'surdo': {
        hands = [
          {
            wristOffsetBodyNorm: {
              x: 0.30 - tNorm * 0.26,
              y: -0.52 + tNorm * 0.22,
              z: -0.04
            },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
          }
        ];
        break;
      }
      default:
        throw new Error(`Unsupported synthetic generator id: ${signId}`);
    }

    const snap = makeSnapshot({
      timestampMs: tMs,
      bodyScale: options.bodyScale ?? 0.28,
      hands,
      faceOpts,
      noiseStd: options.noiseStd ?? 0
    });

    // Special 2-hand roof geometry for 'casa': rotate left & right hands ±38° around Z so fingertips touch above while wrists stay spread apart
    if (signId === 'casa') {
      const bs = options.bodyScale ?? 0.28;
      const palmScale = bs * 0.34;
      const shoulderMid = { x: 0.5, y: 0.46, z: 0 };
      const poseLm = generateSyntheticPose({ shoulderMid, bodyScale: bs });
      const faceLm = generateSyntheticFace({ center: poseLm[0], faceScale: bs * 0.56 });

      const buildTiltedRoofHand = (handedness: HandednessLabel, tiltSign: number) => {
        // Wrist at lower outer position, fingers angled inward toward apex
        const wristPos = {
          x: shoulderMid.x + tiltSign * 0.9 * palmScale,
          y: shoulderMid.y + 0.48 * bs,
          z: -0.04 * bs
        };
        const base = generateSyntheticHand({
          wristPos,
          palmScale,
          facing: 'camera',
          handedness,
          spec: { thumb: 0.65, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 },
          noiseStd: options.noiseStd ?? 0
        });
        const angle = -tiltSign * 0.62; // Rotate top inward toward midline (x = 0.5)
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rotated = base.map((pt) => {
          const dx = pt.x - wristPos.x;
          const dy = pt.y - wristPos.y;
          return {
            x: wristPos.x + dx * cosA - dy * sinA,
            y: wristPos.y + dx * sinA + dy * cosA,
            z: pt.z
          };
        });
        return extractHandGeometry(rotated, handedness);
      };

      const hR = buildTiltedRoofHand('Right', -1);
      const hL = buildTiltedRoofHand('Left', 1);
      buffer.push({
        timestampMs: tMs,
        hands: [hR, hL],
        body: extractBodyContext(poseLm, [hR, hL]),
        face: extractFaceExpressions(faceLm)
      });
    } else {
      buffer.push(snap);
    }
  }

  return buffer;
}

// ============================================================================
// TEST SUITE
// ============================================================================

test('1. Todos os 19 sinais validados são reconhecidos corretamente com precisão >= threshold', () => {
  const validated = LIBRAS_SIGN_DATABASE.filter((s) => s.validationStatus === 'validated');
  assert.equal(validated.length, 19);

  for (const spec of validated) {
    const buffer = simulateValidatedSignBuffer(spec.id);
    const res = evaluateMultimodalLibrasSign(buffer, { confidenceThreshold: 75 });
    assert.equal(
      res.status,
      'recognized',
      `Esperava reconhecimento para "${spec.id}", recebeu ${res.status} (${res.message}, top=${res.topCandidate?.sign.id}:${res.confidence}%)`
    );
    assert.equal(res.sign?.id, spec.id, `Sinal errado para "${spec.id}": obteve "${res.sign?.id}"`);
    assert.ok(
      res.confidence >= Math.max(75, Math.round(spec.minConfidence * 100)),
      `Confiança insuficiente para "${spec.id}": ${res.confidence}%`
    );
  }
});

test('2. Sinais pending_validation (desculpa, bom_dia, boa_noite) nunca são auto-confirmados como validados', () => {
  const pending = LIBRAS_SIGN_DATABASE.filter((s) => s.validationStatus === 'pending_validation');
  assert.deepEqual(
    pending.map((s) => s.id).sort(),
    ['boa_noite', 'bom_dia', 'desculpa']
  );

  // Test Y-hand at chin (desculpa) -> must NOT trigger any validated sign falsely
  const buffer = new TemporalMotionBuffer(24, 1500);
  for (let i = 0; i < 8; i++) {
    buffer.push(
      makeSnapshot({
        timestampMs: i * 45,
        hands: [
          {
            wristOffsetBodyNorm: { x: 0.0, y: -0.22, z: -0.04 },
            facing: 'signer',
            handedness: 'Right',
            spec: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 1, thumbSpreadDeg: 60 }
          }
        ]
      })
    );
  }
  const res = evaluateMultimodalLibrasSign(buffer, { confidenceThreshold: 75 });
  assert.notEqual(res.status, 'recognized');
});

test('3. Desambiguação entre sinais confundíveis (EU vs VOCÊ vs NÃO vs SABER; PAZ vs OI; CASA vs POR_FAVOR)', () => {
  // EU vs VOCÊ: same 1-handshape, opposite 3D pointing vector
  const euRes = evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('eu'), { confidenceThreshold: 75 });
  const voceRes = evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('voce'), { confidenceThreshold: 75 });
  assert.equal(euRes.sign?.id, 'eu');
  assert.equal(voceRes.sign?.id, 'voce');

  // Static index finger held at shoulder WITHOUT lateral oscillation must NOT trigger NÃO
  const staticIndexBuffer = new TemporalMotionBuffer(24, 1500);
  for (let i = 0; i < 10; i++) {
    staticIndexBuffer.push(
      makeSnapshot({
        timestampMs: i * 50,
        hands: [
          {
            wristOffsetBodyNorm: { x: -0.22, y: -0.14, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
          }
        ]
      })
    );
  }
  const staticIndexRes = evaluateMultimodalLibrasSign(staticIndexBuffer, { confidenceThreshold: 75 });
  assert.notEqual(staticIndexRes.sign?.id, 'nao', 'Indicador parado não deve disparar NÃO');

  // Static fist held in neutral space must NOT trigger SIM
  const staticFistBuffer = new TemporalMotionBuffer(24, 1500);
  for (let i = 0; i < 10; i++) {
    staticFistBuffer.push(
      makeSnapshot({
        timestampMs: i * 50,
        hands: [
          {
            wristOffsetBodyNorm: { x: 0.05, y: 0.45, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
          }
        ]
      })
    );
  }
  const staticFistRes = evaluateMultimodalLibrasSign(staticFistBuffer, { confidenceThreshold: 75 });
  assert.notEqual(staticFistRes.sign?.id, 'sim', 'Punho parado não deve disparar SIM');

  // Static open hand raised at shoulder WITHOUT waving must NOT trigger OI
  const staticOpenBuffer = new TemporalMotionBuffer(24, 1500);
  for (let i = 0; i < 10; i++) {
    staticOpenBuffer.push(
      makeSnapshot({
        timestampMs: i * 50,
        hands: [
          {
            wristOffsetBodyNorm: { x: -0.45, y: -0.15, z: -0.04 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 14 }
          }
        ]
      })
    );
  }
  const staticOpenRes = evaluateMultimodalLibrasSign(staticOpenBuffer, { confidenceThreshold: 75 });
  assert.notEqual(staticOpenRes.sign?.id, 'oi', 'Mão aberta parada não deve disparar OI');

  // U-hand (index+middle TOGETHER, < 6° spread) must NOT trigger PAZ
  const tightUBuffer = new TemporalMotionBuffer(24, 1500);
  for (let i = 0; i < 10; i++) {
    tightUBuffer.push(
      makeSnapshot({
        timestampMs: i * 50,
        hands: [
          {
            wristOffsetBodyNorm: { x: 0.05, y: 0.42, z: -0.05 },
            facing: 'camera',
            handedness: 'Right',
            spec: { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0, indexSpreadDeg: 2, thumbCrossInward: true }
          }
        ]
      })
    );
  }
  const tightURes = evaluateMultimodalLibrasSign(tightUBuffer, { confidenceThreshold: 75 });
  assert.notEqual(tightURes.sign?.id, 'paz', 'Dedos juntos (em U) não devem disparar PAZ');

  // CASA vs POR_FAVOR vs LIBRAS vs AJUDAR
  assert.equal(evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('casa')).sign?.id, 'casa');
  assert.equal(evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('por_favor')).sign?.id, 'por_favor');
  assert.equal(evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('libras')).sign?.id, 'libras');
  assert.equal(evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('ajudar')).sign?.id, 'ajudar');
});

test('4. Oclusão parcial e ruído moderado nos landmarks: tolera jitter leve e bloqueia sinal de 2 mãos com 1 mão oculta', () => {
  // Moderate Gaussian-like noise (0.004 screen units) still recognizes AMOR and PAZ
  const noisyAmor = simulateValidatedSignBuffer('amor', { noiseStd: 0.004 });
  const amorRes = evaluateMultimodalLibrasSign(noisyAmor, { confidenceThreshold: 75 });
  assert.equal(amorRes.status, 'recognized');
  assert.equal(amorRes.sign?.id, 'amor');

  // Occluded second hand in a 2-hand sign (e.g. only 1 hand of CASA visible) must NOT trigger CASA
  const oneHandCasa = new TemporalMotionBuffer(24, 1500);
  for (let i = 0; i < 8; i++) {
    oneHandCasa.push(
      makeSnapshot({
        timestampMs: i * 50,
        hands: [
          {
            wristOffsetBodyNorm: { x: -0.2, y: 0.42, z: -0.05 },
            facing: 'inward',
            handedness: 'Right',
            spec: { thumb: 0.7, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 4 }
          }
        ]
      })
    );
  }
  const occludedRes = evaluateMultimodalLibrasSign(oneHandCasa, { confidenceThreshold: 75 });
  assert.notEqual(occludedRes.sign?.id, 'casa');
  assert.notEqual(occludedRes.sign?.id, 'por_favor');
  assert.notEqual(occludedRes.sign?.id, 'libras');
  assert.notEqual(occludedRes.sign?.id, 'ajudar');
});

test('5. Invariância de escala e distância da câmera (longe 0.17 vs médio 0.28 vs perto 0.46)', () => {
  const distances = [0.17, 0.28, 0.46];
  const testIds = ['tudo_bem', 'amor', 'paz', 'oi', 'obrigado', 'agua', 'saber', 'surdo'];

  for (const id of testIds) {
    for (const bodyScale of distances) {
      const buf = simulateValidatedSignBuffer(id, { bodyScale });
      const res = evaluateMultimodalLibrasSign(buf, { confidenceThreshold: 75 });
      assert.equal(
        res.status,
        'recognized',
        `Falha de escala em "${id}" com bodyScale=${bodyScale}: status=${res.status}, msg=${res.message}`
      );
      assert.equal(res.sign?.id, id);
    }
  }
});

test('6. Variação de velocidade de execução via DTW (0.5x lento, 1.0x normal, 2.0x rápido)', () => {
  const speeds = [0.5, 1.0, 2.0];
  const dynamicSigns = ['oi', 'nao', 'sim', 'gostar', 'surdo'];

  // Direct DTW check: 0.5x and 2.0x resampled trajectories retain high DTW similarity
  const tpl = [
    { x: -0.18, y: 0, z: 0 },
    { x: 0.18, y: 0, z: 0 },
    { x: -0.18, y: 0, z: 0 },
    { x: 0.18, y: 0, z: 0 }
  ];
  const slowObs = [
    { x: -0.18, y: 0, z: 0 },
    { x: -0.18, y: 0, z: 0 },
    { x: 0.0, y: 0, z: 0 },
    { x: 0.18, y: 0, z: 0 },
    { x: 0.18, y: 0, z: 0 },
    { x: -0.18, y: 0, z: 0 },
    { x: 0.18, y: 0, z: 0 }
  ];
  assert.ok(computeDtwTrajectorySimilarity(slowObs, tpl) > 0.75);

  for (const id of dynamicSigns) {
    for (const spd of speeds) {
      const buf = simulateValidatedSignBuffer(id, { speedMultiplier: spd });
      const res = evaluateMultimodalLibrasSign(buf, { confidenceThreshold: 75 });
      assert.equal(
        res.status,
        'recognized',
        `Falha de velocidade (${spd}x) para "${id}": ${res.message}`
      );
      assert.equal(res.sign?.id, id);
    }
  }
});

test('7. Perda de rastreamento (no_hands) reseta imediatamente o Hold-to-Confirm', () => {
  let hold = createInitialHoldState();
  const resValid = evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('amor'), {
    confidenceThreshold: 75
  });
  assert.equal(resValid.status, 'recognized');

  // Hold for 300ms (< 650ms) -> progress ~46%
  hold = stepHoldToConfirm(hold, resValid, 1000).nextState;
  hold = stepHoldToConfirm(hold, resValid, 1300).nextState;
  assert.equal(hold.candidateSignId, 'amor');
  assert.ok(hold.progressPercent > 30 && hold.progressPercent < 100);

  // Tracking lost -> immediate reset to 0%
  const noHandsEval = evaluateMultimodalLibrasSign(new TemporalMotionBuffer(10, 1000));
  assert.equal(noHandsEval.status, 'no_hands');
  const afterLoss = stepHoldToConfirm(hold, noHandsEval, 1350);
  assert.equal(afterLoss.nextState.progressPercent, 0);
  assert.equal(afterLoss.nextState.candidateSignId, null);
  assert.equal(afterLoss.newlyConfirmedSign, null);
});

test('8. Movimentos aleatórios / erráticos são rejeitados sem falsos positivos', () => {
  const randomBuf = new TemporalMotionBuffer(24, 1500);
  for (let i = 0; i < 14; i++) {
    randomBuf.push(
      makeSnapshot({
        timestampMs: i * 45,
        hands: [
          {
            wristOffsetBodyNorm: {
              x: Math.sin(i * 1.9) * 0.45,
              y: 0.25 + Math.cos(i * 2.7) * 0.35,
              z: Math.sin(i * 0.9) * 0.1
            },
            facing: 'outward',
            handedness: 'Right',
            spec: {
              // Unmapped alternating finger posture (middle & pinky straight, index & ring curled)
              thumb: 0,
              index: 0,
              middle: 1,
              ring: 0,
              pinky: 1,
              thumbCrossInward: true
            }
          }
        ]
      })
    );
  }
  const res = evaluateMultimodalLibrasSign(randomBuf, { confidenceThreshold: 75 });
  assert.notEqual(res.status, 'recognized', 'Movimento aleatório não deve gerar sinal');
});

test('9. Bloqueio rigoroso por threshold de confiança (limiar alto impede confirmação insegura)', () => {
  // Heavy distortion on PAZ lowers confidence below strict threshold 92%
  const noisyPaz = simulateValidatedSignBuffer('paz', { noiseStd: 0.025 });
  const strictRes = evaluateMultimodalLibrasSign(noisyPaz, { confidenceThreshold: 92 });
  assert.equal(strictRes.status, 'below_threshold');
  assert.equal(strictRes.sign, null);

  let hold = createInitialHoldState();
  const step1 = stepHoldToConfirm(hold, strictRes, 1000);
  const step2 = stepHoldToConfirm(step1.nextState, strictRes, 2000);
  assert.equal(step2.newlyConfirmedSign, null);
  assert.equal(step2.nextState.progressPercent, 0);
});

test('10. Hold-to-Confirm: ciclo completo, sem duplicação contínua, reset na troca de sinal e construção honesta de frases', () => {
  const amorEval = evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('amor'), {
    confidenceThreshold: 75
  });
  const pazEval = evaluateMultimodalLibrasSign(simulateValidatedSignBuffer('paz'), {
    confidenceThreshold: 75
  });
  const belowEval = evaluateMultimodalLibrasSign(new TemporalMotionBuffer(10, 1000));

  let hold = createInitialHoldState();
  const config = { holdDurationMs: 600, releaseNeutralFramesRequired: 3 };

  // Start AMOR at t=1000
  let step = stepHoldToConfirm(hold, amorEval, 1000, config);
  hold = step.nextState;
  assert.equal(step.newlyConfirmedSign, null);

  // Mid-hold AMOR at t=1300 -> ~50%
  step = stepHoldToConfirm(hold, amorEval, 1300, config);
  hold = step.nextState;
  assert.equal(hold.candidateSignId, 'amor');
  assert.equal(hold.progressPercent, 50);
  assert.equal(step.newlyConfirmedSign, null);

  // Switch abruptly to PAZ at t=1400 -> timer must reset!
  step = stepHoldToConfirm(hold, pazEval, 1400, config);
  hold = step.nextState;
  assert.equal(hold.candidateSignId, 'paz');
  assert.equal(hold.progressPercent, 5);
  assert.equal(step.newlyConfirmedSign, null);

  // Complete hold on PAZ at t=2050 -> confirms ONCE
  step = stepHoldToConfirm(hold, pazEval, 2050, config);
  hold = step.nextState;
  assert.equal(step.newlyConfirmedSign?.id, 'paz');
  assert.equal(hold.progressPercent, 100);
  assert.equal(hold.lockedUntilNeutral, true);

  // Continue holding PAZ for extra frames -> ZERO duplicate confirmations
  for (let t = 2100; t <= 2600; t += 50) {
    step = stepHoldToConfirm(hold, pazEval, t, config);
    hold = step.nextState;
    assert.equal(step.newlyConfirmedSign, null, 'Não deve duplicar sinal enquanto mantido');
  }

  // Release through neutral/low-confidence frames (below_threshold)
  const weakEval = { ...belowEval, status: 'below_threshold' as const };
  for (let i = 0; i < 3; i++) {
    step = stepHoldToConfirm(hold, weakEval, 2700 + i * 50, config);
    hold = step.nextState;
  }
  assert.equal(hold.lockedUntilNeutral, false, 'Deve rearmar após quadros neutros');

  // Honest phrase builder: separates glosses, literal mapping, contextual phrase, and notice
  const knownSeq = buildTranslationOutput(['EU', 'APRENDER', 'LIBRAS'], 'neutral');
  assert.equal(knownSeq.glossSequenceText, 'EU APRENDER LIBRAS');
  assert.equal(knownSeq.literalPortuguese, 'Eu Aprender Libras.');
  assert.equal(knownSeq.contextualSuggestion, 'Eu estou aprendendo Libras.');
  assert.equal(knownSeq.isExactIdiomaticMatch, true);
  assert.ok(knownSeq.methodologyNotice.includes('sinais isolados'));

  const arbitrarySeq = buildTranslationOutput(['CASA', 'AGUA', 'PAZ'], 'interrogative_brows_up');
  assert.equal(arbitrarySeq.glossSequenceText, 'CASA AGUA PAZ');
  assert.equal(arbitrarySeq.literalPortuguese, 'Casa Água Paz?');
  assert.equal(arbitrarySeq.contextualSuggestion, null);
  assert.equal(arbitrarySeq.isExactIdiomaticMatch, false);
});

test('11. Correção de ângulos 3D do polegar (estendido vs dobrado) e fallback de quadris fora da tela', () => {
  const straightThumbLm = generateSyntheticHand({
    wristPos: { x: 0.5, y: 0.55, z: -0.04 },
    palmScale: 0.095,
    facing: 'camera',
    handedness: 'Right',
    spec: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0, thumbSpreadDeg: 62 }
  });
  const straightGeo = extractHandGeometry(straightThumbLm, 'Right');
  assert.ok(
    straightGeo.fingers.thumb.pipAngleDeg > 130,
    `Ângulo IP do polegar estendido deve ser > 130°, obteve ${straightGeo.fingers.thumb.pipAngleDeg.toFixed(1)}°`
  );
  assert.ok(
    straightGeo.fingers.thumb.extensionScore >= 0.8,
    `Polegar estendido deve pontuar >= 0.80, obteve ${straightGeo.fingers.thumb.extensionScore.toFixed(3)}`
  );

  const tuckedThumbLm = generateSyntheticHand({
    wristPos: { x: 0.5, y: 0.55, z: -0.04 },
    palmScale: 0.095,
    facing: 'camera',
    handedness: 'Right',
    spec: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
  });
  const tuckedGeo = extractHandGeometry(tuckedThumbLm, 'Right');
  assert.ok(
    tuckedGeo.fingers.thumb.extensionScore < 0.45,
    `Polegar dobrado deve pontuar < 0.45, obteve ${tuckedGeo.fingers.thumb.extensionScore.toFixed(3)}`
  );

  const poseOffscreenHips = generateSyntheticPose({
    shoulderMid: { x: 0.5, y: 0.46, z: 0 },
    bodyScale: 0.28
  });
  poseOffscreenHips[23] = { x: 0.6, y: 1.45, z: 0 };
  poseOffscreenHips[24] = { x: 0.4, y: 1.45, z: 0 };
  const bodyCtx = extractBodyContext(poseOffscreenHips, [straightGeo]);
  assert.ok(
    Math.abs(bodyCtx.torsoHeight - 0.28 * 1.28) < 0.02,
    `torsoHeight não deve distorcer com quadris fora da tela: ${bodyCtx.torsoHeight}`
  );
});

