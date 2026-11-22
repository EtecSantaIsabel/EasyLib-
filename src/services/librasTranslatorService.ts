// Multimodal Real-Time Libras Recognition & Honest Translation Engine
// Combines 3D Hand, Body (Pose) and Facial (NMF) Landmarks with Temporal Kinematics & DTW

import { LIBRAS_SIGN_DATABASE } from '../data/librasSignDatabase';
import {
  ConfidenceBreakdown,
  HandGeometryFeatures,
  LibrasSignSpecification,
  MultimodalFrameSnapshot,
  NmfExpressionType,
  RecognitionEvaluation
} from '../types/librasRecognition';
import {
  clamp01,
  dist3D,
  extractHandGeometry,
  normalize3D,
  sub3D
} from './multimodalGeometry';
import {
  computeDtwTrajectorySimilarity,
  TemporalMotionBuffer
} from './temporalAnalyzer';

export interface RecognizedSign {
  id: string;
  name: string;
  gloss: string;
  category: string;
  icon: string;
  description: string;
  portugueseTranslation: string;
  validationStatus?: 'validated' | 'pending_validation';
}

// Backwards-compatible catalog projection derived directly from the structured database
export const REAL_LIBRAS_SIGNS: RecognizedSign[] = LIBRAS_SIGN_DATABASE.map((s) => ({
  id: s.id,
  name: s.name,
  gloss: s.gloss,
  category: s.category,
  icon: s.icon,
  description: s.description,
  portugueseTranslation: s.portugueseTranslations[0],
  validationStatus: s.validationStatus
}));

export function toRecognizedSign(spec: LibrasSignSpecification): RecognizedSign {
  return {
    id: spec.id,
    name: spec.name,
    gloss: spec.gloss,
    category: spec.category,
    icon: spec.icon,
    description: spec.description,
    portugueseTranslation: spec.portugueseTranslations[0],
    validationStatus: spec.validationStatus
  };
}

/**
 * Legacy-compatible helper backed by full 3D joint-angle geometry.
 */
export function getFingerStates(landmarks: { x: number; y: number; z?: number }[]) {
  if (!landmarks || landmarks.length < 21) {
    return {
      thumbExtended: false,
      indexExtended: false,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      isFist: false,
      isOpen: false,
      isThumbsUp: false,
      isPeace: false,
      isPoint: false,
      isIly: false,
      isL: false,
      isPinch: false,
      isC: false,
      isB: false,
      isA: false,
      palmScale: 0.1,
      handCenter: { x: 0.5, y: 0.5 }
    };
  }

  const g = extractHandGeometry(landmarks, 'Unknown');
  const thumbExtended = g.fingers.thumb.extensionScore >= 0.6;
  const indexExtended = g.fingers.index.extensionScore >= 0.65;
  const middleExtended = g.fingers.middle.extensionScore >= 0.65;
  const ringExtended = g.fingers.ring.extensionScore >= 0.65;
  const pinkyExtended = g.fingers.pinky.extensionScore >= 0.65;

  const isThumbsUp =
    thumbExtended &&
    !indexExtended &&
    !middleExtended &&
    !ringExtended &&
    !pinkyExtended &&
    g.landmarks[4].y < g.landmarks[2].y;

  const isFist =
    g.fingers.index.extensionScore < 0.35 &&
    g.fingers.middle.extensionScore < 0.35 &&
    g.fingers.ring.extensionScore < 0.35 &&
    g.fingers.pinky.extensionScore < 0.35 &&
    !isThumbsUp;

  const isOpen = indexExtended && middleExtended && ringExtended && pinkyExtended;
  const isPoint = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
  const isPeace =
    indexExtended &&
    middleExtended &&
    !ringExtended &&
    !pinkyExtended &&
    g.spreadAnglesDeg.indexMiddle > 12;
  const isIly = thumbExtended && indexExtended && !middleExtended && !ringExtended && pinkyExtended;
  const isL =
    thumbExtended &&
    indexExtended &&
    !middleExtended &&
    !ringExtended &&
    !pinkyExtended &&
    g.normalizedTipDistances.thumbToIndexTip > 0.7;
  const isPinch = g.normalizedTipDistances.thumbToIndexTip < 0.4;
  const isB = isOpen && g.spreadAnglesDeg.indexMiddle < 18 && !thumbExtended;
  const isA = isFist && g.fingers.thumb.extensionScore > 0.4;
  const isC =
    !isOpen &&
    !isFist &&
    g.normalizedTipDistances.thumbToIndexTip >= 0.45 &&
    g.normalizedTipDistances.thumbToIndexTip <= 0.95;

  return {
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    isFist,
    isOpen,
    isThumbsUp,
    isPeace,
    isPoint,
    isIly,
    isL,
    isPinch,
    isC,
    isB,
    isA,
    palmScale: g.palmScale,
    handCenter: { x: g.handCenter.x, y: g.handCenter.y }
  };
}

function rangeSimilarity(value: number, [min, max]: [number, number], tolerance = 0.25): number {
  if (value >= min && value <= max) return 1.0;
  const dist = value < min ? min - value : value - max;
  return clamp01(1 - dist / tolerance);
}

function scoreHandshape(hand: HandGeometryFeatures, spec: LibrasSignSpecification): number {
  const p = spec.handshapeProfile;
  const sThumb = rangeSimilarity(hand.fingers.thumb.extensionScore, p.thumb, 0.3);
  const sIndex = rangeSimilarity(hand.fingers.index.extensionScore, p.index, 0.28);
  const sMiddle = rangeSimilarity(hand.fingers.middle.extensionScore, p.middle, 0.28);
  const sRing = rangeSimilarity(hand.fingers.ring.extensionScore, p.ring, 0.28);
  const sPinky = rangeSimilarity(hand.fingers.pinky.extensionScore, p.pinky, 0.28);

  // Strict weighted average — index/middle/ring/pinky have slightly higher weight
  let score = sThumb * 0.16 + sIndex * 0.24 + sMiddle * 0.22 + sRing * 0.19 + sPinky * 0.19;

  // Additional geometric constraints
  if (p.maxThumbIndexTipDist !== undefined) {
    if (hand.normalizedTipDistances.thumbToIndexTip > p.maxThumbIndexTipDist) {
      const over = hand.normalizedTipDistances.thumbToIndexTip - p.maxThumbIndexTipDist;
      score *= clamp01(1 - over / 0.35);
    }
  }
  if (p.minThumbIndexTipDist !== undefined) {
    if (hand.normalizedTipDistances.thumbToIndexTip < p.minThumbIndexTipDist) {
      const under = p.minThumbIndexTipDist - hand.normalizedTipDistances.thumbToIndexTip;
      score *= clamp01(1 - under / 0.35);
    }
  }
  if (p.minIndexMiddleSpread !== undefined) {
    if (hand.spreadAnglesDeg.indexMiddle < p.minIndexMiddleSpread) {
      const under = p.minIndexMiddleSpread - hand.spreadAnglesDeg.indexMiddle;
      score *= clamp01(1 - under / 12);
    }
  }
  if (p.maxIndexMiddleSpread !== undefined) {
    if (hand.spreadAnglesDeg.indexMiddle > p.maxIndexMiddleSpread) {
      const over = hand.spreadAnglesDeg.indexMiddle - p.maxIndexMiddleSpread;
      score *= clamp01(1 - over / 18);
    }
  }

  return clamp01(score);
}

function scoreOrientation(hand: HandGeometryFeatures, spec: LibrasSignSpecification): number {
  if (spec.allowedPalmFacings.includes('any') || spec.allowedPalmFacings.includes(hand.palmFacing)) {
    return 1.0;
  }
  // If palm facing is adjacent/unknown, give partial score rather than 0, unless opposite
  const oppositePairs: Record<string, string> = {
    camera: 'signer',
    signer: 'camera',
    up: 'down',
    down: 'up',
    inward: 'outward',
    outward: 'inward'
  };
  const isOpposite = spec.allowedPalmFacings.some((f) => oppositePairs[f] === hand.palmFacing);
  return isOpposite ? 0.2 : 0.6;
}

function scoreLocation(
  snapshot: MultimodalFrameSnapshot,
  hand: HandGeometryFeatures,
  handIdx: number,
  spec: LibrasSignSpecification
): number {
  const zoneBySide =
    hand.handedness === 'Right'
      ? snapshot.body.rightHandZone
      : hand.handedness === 'Left'
      ? snapshot.body.leftHandZone
      : handIdx === 0
      ? snapshot.body.leftHandZone
      : snapshot.body.rightHandZone;
  const fallbackZone = snapshot.body.leftHandZone ?? snapshot.body.rightHandZone;
  const activeZone = zoneBySide ?? fallbackZone;
  if (!activeZone) return 0.2;

  if (spec.referencePoints.includes(activeZone)) {
    // Extra 3D pointing vector disambiguation for EU vs VOCÊ
    if (spec.id === 'eu' || spec.id === 'voce') {
      const idxVec = normalize3D(sub3D(hand.landmarks[8], hand.landmarks[5]));
      // In MediaPipe coordinates: z > 0 points toward signer body, z < 0 points toward camera
      const pointsTowardBody = idxVec.z > 0.15 || dist3D(hand.landmarks[8], snapshot.body.chestCenter) < dist3D(hand.landmarks[5], snapshot.body.chestCenter);
      const pointsForwardCamera = idxVec.z < -0.22;

      if (spec.id === 'eu') {
        return pointsTowardBody ? 1.0 : 0.25;
      }
      if (spec.id === 'voce') {
        return pointsForwardCamera ? 1.0 : 0.25;
      }
    }
    return 1.0;
  }

  // Adjacent tolerable zones
  const adjacent: Record<string, string[]> = {
    forehead: ['temple', 'above_shoulder'],
    temple: ['forehead', 'ear', 'above_shoulder'],
    ear: ['temple', 'nose_mouth'],
    nose_mouth: ['chin', 'temple', 'chest'],
    chin: ['nose_mouth', 'chest'],
    chest: ['neutral_space', 'neck_shoulder', 'chin'],
    neutral_space: ['chest', 'neck_shoulder', 'above_shoulder'],
    above_shoulder: ['neutral_space', 'neck_shoulder', 'temple'],
    neck_shoulder: ['chest', 'above_shoulder', 'neutral_space']
  };

  const isNear = spec.referencePoints.some((rp) => (adjacent[rp] ?? []).includes(activeZone));
  if (isNear) {
    // Still enforce EU vs VOCE vector direction even in adjacent chest/neutral zone
    if (spec.id === 'eu' || spec.id === 'voce') {
      const idxVec = normalize3D(sub3D(hand.landmarks[8], hand.landmarks[5]));
      if (spec.id === 'eu') return idxVec.z > 0.15 ? 0.8 : 0.2;
      if (spec.id === 'voce') return idxVec.z < -0.22 ? 0.8 : 0.2;
    }
    return 0.65;
  }

  return 0.15;
}

function scoreMovementAndDtw(
  snapshot: MultimodalFrameSnapshot,
  buffer: TemporalMotionBuffer,
  spec: LibrasSignSpecification
): { score: number; failureReason?: string } {
  const summary = buffer.summarize();
  const kin = summary.primaryHandKinematics;
  const secondKin = summary.secondaryHandKinematics;
  const hands = snapshot.hands;

  // Two-handed structural & kinematic checks
  if (spec.twoHanded === 2) {
    if (hands.length < 2 || summary.twoHandDistanceAvg === null || summary.twoHandTipDistanceAvg === null) {
      return { score: 0, failureReason: 'Sinal exige as duas mãos visíveis.' };
    }

    const h1 = hands[0];
    const h2 = hands[1];
    const wristDist = summary.twoHandDistanceAvg;
    const tipDist = summary.twoHandTipDistanceAvg;

    if (spec.movementType === 'two_hand_roof') {
      // CASA: tips close (< 0.95), wrists spread (> 1.3), wrists below index tips
      const tipsClose = tipDist < 0.95;
      const wristsApart = wristDist > 1.3;
      const roofAngle = h1.landmarks[0].y > h1.landmarks[8].y && h2.landmarks[0].y > h2.landmarks[8].y;
      if (!tipsClose || !wristsApart || !roofAngle) {
        return { score: 0.25, failureReason: 'Junte as pontas dos dedos no alto formando um telhado.' };
      }
      return { score: 0.95 };
    }

    if (spec.movementType === 'two_hand_contact') {
      // POR_FAVOR: both palms/wrists close together
      if (tipDist > 0.95 || wristDist > 1.25) {
        return { score: 0.3, failureReason: 'Una as duas palmas das mãos em frente ao peito.' };
      }
      return { score: 0.94 };
    }

    if (spec.movementType === 'two_hand_support') {
      // AJUDAR: one fist + one open palm close together
      const h1Fist = h1.averageFingerOpenness < 0.4;
      const h2Fist = h2.averageFingerOpenness < 0.4;
      const h1Open = h1.averageFingerOpenness > 0.65;
      const h2Open = h2.averageFingerOpenness > 0.65;
      const validPair = (h1Fist && h2Open) || (h1Open && h2Fist);
      if (!validPair || wristDist > 1.45) {
        return { score: 0.22, failureReason: 'Apoie uma mão fechada sobre a palma aberta da outra.' };
      }
      return { score: 0.94 };
    }

    if (spec.movementType === 'two_hand_alternating') {
      // LIBRAS: two open hands oscillating alternately in front of chest
      const bothOpen = h1.averageFingerOpenness > 0.62 && h2.averageFingerOpenness > 0.62;
      if (!bothOpen) {
        return { score: 0.25, failureReason: 'Mantenha as duas mãos abertas.' };
      }
      if (summary.twoHandAlternatingScore < 0.32) {
        return { score: 0.25, failureReason: 'Movimente as duas mãos alternadamente no ar.' };
      }
      return { score: clamp01(0.65 + summary.twoHandAlternatingScore * 0.35) };
    }
  }

  // Single-hand kinematic checks
  if (!kin) {
    return { score: 0.2, failureReason: 'Histórico temporal insuficiente.' };
  }

  if (!spec.requiresMotion) {
    // Static / gentle hold signs should NOT be oscillating laterally/vertically or whipping wildly across screen
    if (kin.isOscillatingLateral || kin.isOscillatingVertical || kin.isCircular) {
      return { score: 0.45, failureReason: 'Movimento oscilatório detectado em sinal estático.' };
    }
    if (kin.peakSpeed > 3.2 && kin.totalPathLength > 0.75) {
      return { score: 0.35, failureReason: 'Movimento excessivo para um sinal estável.' };
    }
    return { score: 0.92 };
  }

  // Dynamic signs REQUIRE genuine motion matching the linguistic trajectory
  const dtwScore = spec.dtwTrajectoryTemplate
    ? computeDtwTrajectorySimilarity(kin.trajectoryBodyNorm, spec.dtwTrajectoryTemplate)
    : 0.7;

  switch (spec.movementType) {
    case 'oscillating_lateral': {
      const hasOsc = kin.isOscillatingLateral || (spec.id === 'nao' && summary.headShakeCycles >= 1);
      if (!hasOsc) {
        return { score: 0.18, failureReason: 'Faça o movimento lateral oscilatório.' };
      }
      return { score: clamp01(0.55 + dtwScore * 0.45) };
    }
    case 'nodding_vertical': {
      const hasNod = kin.isOscillatingVertical || summary.headNodCycles >= 1;
      if (!hasNod) {
        return { score: 0.18, failureReason: 'Faça o movimento vertical afirmativo (subir/descer).' };
      }
      return { score: clamp01(0.55 + dtwScore * 0.45) };
    }
    case 'forward_away': {
      // OBRIGADO: movement forward (negative Z) or outward arc from chin/forehead
      const movedForward = kin.zApproachDelta < -0.04 || kin.netDisplacement.y > 0.06;
      if (!kin.isMoving || !movedForward) {
        return { score: 0.2, failureReason: 'Projete a mão do rosto para frente.' };
      }
      return { score: clamp01(0.55 + dtwScore * 0.45) };
    }
    case 'circular_chest': {
      if (!kin.isCircular && Math.abs(kin.circularSweepRad) < 1.1) {
        return { score: 0.2, failureReason: 'Faça um movimento circular suave sobre o peito.' };
      }
      return { score: clamp01(0.5 + dtwScore * 0.5) };
    }
    case 'closing_grasp': {
      // APRENDER: fingers closing near forehead
      if (kin.opennessDelta > -0.15) {
        return { score: 0.22, failureReason: 'Feche os dedos suavemente em frente à testa.' };
      }
      return { score: clamp01(0.75 + Math.min(0.25, Math.abs(kin.opennessDelta))) };
    }
    case 'repetitive_to_mouth': {
      const hasMouthMotion = kin.isMoving && (kin.verticalZeroCrossings >= 1 || Math.abs(kin.zApproachDelta) > 0.04);
      if (!hasMouthMotion) {
        return { score: 0.22, failureReason: 'Leve a mão repetidamente em direção à boca.' };
      }
      return { score: clamp01(0.55 + dtwScore * 0.45) };
    }
    case 'ear_to_mouth': {
      // SURDO: moves downward and medially from ear/temple toward mouth
      const movedDownTowardCenter = kin.netDisplacement.y > 0.05 && kin.totalPathLength > 0.12;
      if (!movedDownTowardCenter) {
        return { score: 0.2, failureReason: 'Desloque o indicador da orelha até a boca.' };
      }
      return { score: clamp01(0.5 + dtwScore * 0.5) };
    }
    default: {
      return { score: secondKin ? 0.75 : dtwScore };
    }
  }
}

function scoreTemporalConsistencyAndNmf(
  buffer: TemporalMotionBuffer,
  snapshot: MultimodalFrameSnapshot,
  spec: LibrasSignSpecification
): number {
  const frames = buffer.getFrames().slice(-5);
  if (frames.length < 3) return 0.3;

  // Measure handshape stability over recent 5 frames
  let consistentFrames = 0;
  for (const f of frames) {
    if (f.hands.length === 0) continue;
    const hs = scoreHandshape(f.hands[0], spec);
    if (hs >= 0.6) consistentFrames += 1;
  }
  const stability = consistentFrames / frames.length;

  // NMF boost/compatibility
  let nmfMatch = 0.85;
  if (spec.expectedNmf.includes('any') || spec.expectedNmf.includes(snapshot.face.detectedNmf)) {
    nmfMatch = 1.0;
  }

  return clamp01(stability * 0.75 + nmfMatch * 0.25);
}

/**
 * Evaluates current multimodal frame + temporal history buffer across all validated signs.
 * Enforces strict multi-parameter gating and configurable confidence threshold.
 */
export function evaluateMultimodalLibrasSign(
  buffer: TemporalMotionBuffer,
  options: { confidenceThreshold?: number; minFramesRequired?: number } = {}
): RecognitionEvaluation {
  const userThreshold = options.confidenceThreshold ?? 75;
  const minFramesRequired = options.minFramesRequired ?? 4;

  const frames = buffer.getFrames();
  if (frames.length === 0) {
    return {
      status: 'no_hands',
      sign: null,
      confidence: 0,
      breakdown: null,
      topCandidate: null,
      message: 'Nenhuma mão detectada pela câmera.',
      nmfDetected: 'neutral'
    };
  }

  const latest = frames[frames.length - 1];
  if (latest.hands.length === 0) {
    return {
      status: 'no_hands',
      sign: null,
      confidence: 0,
      breakdown: null,
      topCandidate: null,
      message: 'Posicione uma ou duas mãos diante da câmera.',
      nmfDetected: latest.face.detectedNmf
    };
  }

  if (frames.length < minFramesRequired) {
    return {
      status: 'insufficient_frames',
      sign: null,
      confidence: 0,
      breakdown: null,
      topCandidate: null,
      message: 'Analisando trajetória temporal do movimento...',
      nmfDetected: latest.face.detectedNmf
    };
  }

  const primaryHand = latest.hands[0];
  const temporalSummary = buffer.summarize();
  const bothHandsInteracting =
    latest.hands.length >= 2 &&
    temporalSummary.twoHandDistanceAvg !== null &&
    temporalSummary.twoHandDistanceAvg < 1.7;

  let bestSign: LibrasSignSpecification | null = null;
  let bestBreakdown: ConfidenceBreakdown | null = null;
  let bestFailureReason = 'Configuração ou movimento não corresponde aos sinais validados.';

  // Only evaluate linguistically validated signs for camera recognition
  const validatedSigns = LIBRAS_SIGN_DATABASE.filter((s) => s.validationStatus === 'validated');

  for (const spec of validatedSigns) {
    // Hard gate on 2-hand participation
    if (spec.twoHanded === 2 && latest.hands.length < 2) {
      continue;
    }

    // For AJUDAR / two-hand signs we evaluate handshape against best matching hand
    let handshapeScore = scoreHandshape(primaryHand, spec);
    if (spec.id === 'ajudar' && latest.hands.length >= 2) {
      const h1 = latest.hands[0];
      const h2 = latest.hands[1];
      const oneFistOneOpen =
        (h1.averageFingerOpenness < 0.4 && h2.averageFingerOpenness > 0.65) ||
        (h2.averageFingerOpenness < 0.4 && h1.averageFingerOpenness > 0.65);
      handshapeScore = oneFistOneOpen ? 0.96 : 0.2;
    }

    const orientationScore = scoreOrientation(primaryHand, spec);
    const locationScore = scoreLocation(latest, primaryHand, 0, spec);
    const movementRes = scoreMovementAndDtw(latest, buffer, spec);
    const movementScore = movementRes.score;
    const consistencyScore = scoreTemporalConsistencyAndNmf(buffer, latest, spec);

    let overall =
      handshapeScore * 0.32 +
      orientationScore * 0.14 +
      locationScore * 0.22 +
      movementScore * 0.24 +
      consistencyScore * 0.08;

    // When both hands are closely paired in active signing space, down-weight isolated 1-hand signs
    if (bothHandsInteracting && spec.twoHanded === 1) {
      overall = Math.max(0, overall - 0.16);
    }

    let failureReason = '';
    if (handshapeScore < 0.58) {
      overall = Math.min(overall, 0.52);
      failureReason = `Ajuste a configuração de mão para "${spec.name}".`;
    } else if (locationScore < 0.42) {
      overall = Math.min(overall, 0.55);
      failureReason = `Posicione a mão em: ${spec.articulationLocationLabel}.`;
    } else if (spec.requiresMotion && movementScore < 0.5) {
      overall = Math.min(overall, 0.58);
      failureReason = movementRes.failureReason || `Realize o movimento completo de "${spec.name}".`;
    } else if (movementRes.failureReason && movementScore < 0.6) {
      overall = Math.min(overall, 0.6);
      failureReason = movementRes.failureReason;
    }

    if (!bestBreakdown || overall > bestBreakdown.overallConfidence) {
      bestSign = spec;
      bestFailureReason = failureReason || 'Confiança abaixo do limite configurado.';
      bestBreakdown = {
        handshapeScore,
        orientationScore,
        locationScore,
        movementScore,
        consistencyScore,
        overallConfidence: clamp01(overall)
      };
    }
  }

  if (!bestSign || !bestBreakdown) {
    return {
      status: 'below_threshold',
      sign: null,
      confidence: 0,
      breakdown: null,
      topCandidate: null,
      message: 'Sinal não reconhecido. Repita com mais clareza diante da câmera.',
      nmfDetected: latest.face.detectedNmf
    };
  }

  const confidencePct = Math.round(bestBreakdown.overallConfidence * 100);
  const effectiveThreshold = Math.max(userThreshold, Math.round(bestSign.minConfidence * 100));

  if (confidencePct >= effectiveThreshold) {
    return {
      status: 'recognized',
      sign: bestSign,
      confidence: confidencePct,
      breakdown: bestBreakdown,
      topCandidate: {
        sign: bestSign,
        confidence: confidencePct,
        failureReason: ''
      },
      message: `Sinal reconhecido: ${bestSign.name} (${confidencePct}%)`,
      nmfDetected: latest.face.detectedNmf
    };
  }

  return {
    status: 'below_threshold',
    sign: null,
    confidence: confidencePct,
    breakdown: bestBreakdown,
    topCandidate: {
      sign: bestSign,
      confidence: confidencePct,
      failureReason: bestFailureReason
    },
    message: `Sinal não reconhecido com segurança (${confidencePct}% < ${effectiveThreshold}%). Repita o sinal.`,
    nmfDetected: latest.face.detectedNmf
  };
}

/**
 * Legacy single-call compatibility wrapper using a temporary buffer.
 */
export function detectLibrasSign(
  handsLandmarks: { x: number; y: number; z?: number }[][],
  poseLandmarks?: { x: number; y: number; z?: number }[]
): { sign: RecognizedSign; confidence: number } | null {
  if (!handsLandmarks || handsLandmarks.length === 0) return null;
  const g = extractHandGeometry(handsLandmarks[0], 'Unknown');
  // Quick static check for legacy callers without temporal buffer
  const tempBuffer = new TemporalMotionBuffer(5, 500);
  for (let i = 0; i < 4; i++) {
    tempBuffer.push({
      timestampMs: i * 33,
      hands: handsLandmarks.map((h, idx) =>
        idx === 0 ? g : extractHandGeometry(h, 'Unknown')
      ),
      body: {
        detected: Boolean(poseLandmarks && poseLandmarks.length >= 25),
        bodyScale: 0.28,
        torsoHeight: 0.36,
        shoulderMid: { x: 0.5, y: 0.46, z: 0 },
        hipMid: { x: 0.5, y: 0.82, z: 0 },
        nose: poseLandmarks?.[0] ? { x: poseLandmarks[0].x, y: poseLandmarks[0].y, z: poseLandmarks[0].z ?? 0 } : { x: 0.5, y: 0.27, z: 0 },
        chinEstimate: { x: 0.5, y: 0.35, z: 0 },
        leftEar: { x: 0.59, y: 0.27, z: 0 },
        rightEar: { x: 0.41, y: 0.27, z: 0 },
        mouthMid: { x: 0.5, y: 0.31, z: 0 },
        foreheadEstimate: { x: 0.5, y: 0.19, z: 0 },
        chestCenter: { x: 0.5, y: 0.56, z: 0 },
        leftShoulder: { x: 0.64, y: 0.46, z: 0 },
        rightShoulder: { x: 0.36, y: 0.46, z: 0 },
        trunkLeanDeg: 0,
        leftHandZone: 'neutral_space',
        rightHandZone: null,
        leftHandBodyRelative: { x: 0, y: 0, z: 0 },
        rightHandBodyRelative: null
      },
      face: {
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
      }
    });
  }
  const res = evaluateMultimodalLibrasSign(tempBuffer, { confidenceThreshold: 75 });
  if (res.status === 'recognized' && res.sign) {
    return {
      sign: toRecognizedSign(res.sign),
      confidence: res.confidence / 100
    };
  }
  return null;
}

export interface TranslationOutput {
  glossSequenceText: string;
  literalPortuguese: string;
  contextualSuggestion: string | null;
  isExactIdiomaticMatch: boolean;
  methodologyNotice: string;
}

/**
 * Separates isolated sign recognition (glosses) from literal mapping and optional contextual phrase suggestion.
 * Never claims full grammatical translation when recognizing isolated signs.
 */
export function buildTranslationOutput(
  glossList: string[],
  latestNmf: NmfExpressionType = 'neutral'
): TranslationOutput {
  if (!glossList || glossList.length === 0) {
    return {
      glossSequenceText: '',
      literalPortuguese: 'Aguardando sinais confirmados pela câmera...',
      contextualSuggestion: null,
      isExactIdiomaticMatch: false,
      methodologyNotice:
        'Modo de reconhecimento de sinais isolados. Segure cada sinal até confirmar (100%).'
    };
  }

  const normalized = glossList.map((g) => g.toUpperCase().trim());
  const glossSequenceText = normalized.join(' ');

  // Literal word-for-word Portuguese translation of recognized isolated glosses
  const literalWords = normalized.map((g) => {
    const found = LIBRAS_SIGN_DATABASE.find(
      (s) => s.gloss === g || s.id.toUpperCase() === g
    );
    return found ? found.portugueseTranslations[0] : g;
  });

  const isQuestion = latestNmf === 'interrogative_brows_up' || latestNmf === 'wh_brows_furrowed';
  const punctuation = isQuestion ? '?' : '.';
  const literalPortuguese = literalWords.join(' ') + (literalWords.length > 1 ? punctuation : '');

  // Known contextual sequences ONLY when the full sequence matches cleanly
  const exactIdiomaticPatterns: { pattern: RegExp; suggestion: string }[] = [
    { pattern: /^OI TUDO_BEM$/i, suggestion: 'Olá, tudo bem?' },
    { pattern: /^OI EU APRENDER LIBRAS$/i, suggestion: 'Olá! Eu estou aprendendo Libras.' },
    { pattern: /^EU APRENDER LIBRAS$/i, suggestion: 'Eu estou aprendendo Libras.' },
    { pattern: /^EU GOSTAR LIBRAS$/i, suggestion: 'Eu gosto de Libras.' },
    { pattern: /^EU SABER LIBRAS$/i, suggestion: 'Eu sei Libras.' },
    { pattern: /^VOCE SABER LIBRAS$/i, suggestion: 'Você sabe Libras?' },
    { pattern: /^VOCE AJUDAR EU$/i, suggestion: 'Você pode me ajudar?' },
    { pattern: /^POR_FAVOR AJUDAR$/i, suggestion: 'Por favor, ajude.' },
    { pattern: /^OBRIGADO AJUDAR$/i, suggestion: 'Obrigado(a) pela ajuda.' },
    { pattern: /^EU AMOR VOCE$/i, suggestion: 'Eu te amo.' },
    { pattern: /^EU SURDO$/i, suggestion: 'Eu sou surdo(a).' },
    { pattern: /^SURDO EU$/i, suggestion: 'Eu sou surdo(a).' }
  ];

  const match = exactIdiomaticPatterns.find((p) => p.pattern.test(glossSequenceText));

  return {
    glossSequenceText,
    literalPortuguese,
    contextualSuggestion: match ? match.suggestion : null,
    isExactIdiomaticMatch: Boolean(match),
    methodologyNotice:
      'Reconhecimento por sinais isolados (glosas). A sugestão em português não substitui interpretação gramatical completa em Libras.'
  };
}

export function translateGlossesToPortuguese(glossList: string[]): string {
  const out = buildTranslationOutput(glossList);
  return out.contextualSuggestion ?? out.literalPortuguese;
}

// Browser Text-To-Speech
export function speakPortugueseText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith('pt') || v.lang.includes('BR'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}
