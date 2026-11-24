import { TargetArticulationZone, TargetLandmarks } from '../data/librasCatalog255';
import { clamp01, dist2D, extractFaceExpressions, extractHandGeometry } from './multimodalGeometry';
import { HandednessLabel, HandGeometryFeatures } from '../types/librasRecognition';

export interface RecentHandSample {
  x: number;
  y: number;
  z?: number;
  t: number;
}

export interface SingleTargetValidationResult {
  qualityPercent: number;
  handshapeScore: number;
  locationScore: number;
  stabilityScore: number;
  nmfScore: number;
  detectedHands: boolean;
  detectedFace: boolean;
  passed: boolean;
  tip: string;
}

function rangeSimilarity(value: number, [min, max]: [number, number], tolerance = 0.28): number {
  if (value >= min && value <= max) return 1.0;
  const dist = value < min ? min - value : value - max;
  return clamp01(1 - dist / tolerance);
}

interface HandshapeEvaluation {
  score: number;
  fingerTip: string | null;
}

function scoreSingleHandshape(hand: HandGeometryFeatures, target: TargetLandmarks): HandshapeEvaluation {
  const f = target.fingers;
  const sThumb = rangeSimilarity(hand.fingers.thumb.extensionScore, f.thumb, 0.34);
  const sIndex = rangeSimilarity(hand.fingers.index.extensionScore, f.index, 0.32);
  const sMiddle = rangeSimilarity(hand.fingers.middle.extensionScore, f.middle, 0.32);
  const sRing = rangeSimilarity(hand.fingers.ring.extensionScore, f.ring, 0.32);
  const sPinky = rangeSimilarity(hand.fingers.pinky.extensionScore, f.pinky, 0.32);

  let score = sThumb * 0.16 + sIndex * 0.24 + sMiddle * 0.22 + sRing * 0.19 + sPinky * 0.19;
  let fingerTip: string | null = null;

  if (target.maxThumbIndexTipDist !== undefined) {
    if (hand.normalizedTipDistances.thumbToIndexTip > target.maxThumbIndexTipDist) {
      const over = hand.normalizedTipDistances.thumbToIndexTip - target.maxThumbIndexTipDist;
      score *= clamp01(1 - over / 0.45);
      fingerTip = 'Encoste a ponta do polegar na ponta do indicador.';
    }
  }
  if (target.minThumbIndexTipDist !== undefined) {
    if (hand.normalizedTipDistances.thumbToIndexTip < target.minThumbIndexTipDist) {
      const under = target.minThumbIndexTipDist - hand.normalizedTipDistances.thumbToIndexTip;
      score *= clamp01(1 - under / 0.45);
      fingerTip = 'Afaste o polegar do indicador formando a letra.';
    }
  }
  if (target.minIndexMiddleSpread !== undefined) {
    if (hand.spreadAnglesDeg.indexMiddle < target.minIndexMiddleSpread) {
      const under = target.minIndexMiddleSpread - hand.spreadAnglesDeg.indexMiddle;
      score *= clamp01(1 - under / 16);
      fingerTip = 'Separe os dedos estendidos com clareza.';
    }
  }
  if (target.maxIndexMiddleSpread !== undefined) {
    if (hand.spreadAnglesDeg.indexMiddle > target.maxIndexMiddleSpread) {
      const over = hand.spreadAnglesDeg.indexMiddle - target.maxIndexMiddleSpread;
      score *= clamp01(1 - over / 22);
      fingerTip = 'Mantenha os dedos estendidos unidos.';
    }
  }

  if (!fingerTip) {
    const checks: { name: string; score: number; actual: number; expected: [number, number] }[] = [
      { name: 'polegar', score: sThumb, actual: hand.fingers.thumb.extensionScore, expected: f.thumb },
      { name: 'indicador', score: sIndex, actual: hand.fingers.index.extensionScore, expected: f.index },
      { name: 'dedo médio', score: sMiddle, actual: hand.fingers.middle.extensionScore, expected: f.middle },
      { name: 'anelar', score: sRing, actual: hand.fingers.ring.extensionScore, expected: f.ring },
      { name: 'mínimo', score: sPinky, actual: hand.fingers.pinky.extensionScore, expected: f.pinky }
    ];
    checks.sort((a, b) => a.score - b.score);
    const worst = checks[0];
    if (worst && worst.score < 0.72) {
      if (worst.actual < worst.expected[0]) {
        fingerTip = `Estenda melhor o ${worst.name}.`;
      } else if (worst.actual > worst.expected[1]) {
        fingerTip = `Dobre o ${worst.name} conforme o modelo.`;
      }
    }
  }

  return { score: clamp01(score), fingerTip };
}

function getZoneTip(zone: TargetArticulationZone): string {
  switch (zone) {
    case 'chin':
      return 'Aproxime a mão do queixo.';
    case 'forehead':
      return 'Eleve a mão até a altura da testa.';
    case 'nose_mouth':
      return 'Posicione a mão próxima à boca.';
    case 'ear':
      return 'Leve a mão próxima à orelha.';
    case 'eye_cheek':
      return 'Aproxime a mão da região do rosto.';
    case 'chest':
      return 'Posicione a mão à frente do peito.';
    case 'shoulder':
      return 'Eleve a mão na altura do ombro.';
    case 'neutral_space':
    default:
      return 'Posicione a mão à frente do tronco.';
  }
}

function scoreArticulationZone(
  hand: HandGeometryFeatures,
  zone: TargetArticulationZone,
  faceLandmarks?: { x: number; y: number; z?: number }[]
): { score: number; detectedFace: boolean } {
  const indexTip = hand.landmarks[8];
  const wrist = hand.landmarks[0];
  const refPt = {
    x: (hand.handCenter.x + indexTip.x) / 2,
    y: (hand.handCenter.y + indexTip.y) / 2
  };

  if (faceLandmarks && faceLandmarks.length >= 455) {
    const forehead = faceLandmarks[10];
    const nose = faceLandmarks[1];
    const chin = faceLandmarks[152];
    const mouth = faceLandmarks[13];
    const leftCheek = faceLandmarks[234];
    const rightCheek = faceLandmarks[454];

    const faceHeight = Math.max(0.08, dist2D(forehead, chin));
    const faceWidth = Math.max(0.06, dist2D(leftCheek, rightCheek));
    const faceCenter = {
      x: (leftCheek.x + rightCheek.x) / 2,
      y: (forehead.y + chin.y) / 2
    };

    const distNorm = (targetPt: { x: number; y: number }) => {
      const d1 = dist2D(refPt, targetPt) / faceHeight;
      const d2 = dist2D(indexTip, targetPt) / faceHeight;
      const d3 = dist2D(hand.handCenter, targetPt) / faceHeight;
      return Math.min(d1, d2, d3);
    };

    switch (zone) {
      case 'chin': {
        const d = distNorm(chin);
        return { score: clamp01(1 - Math.max(0, d - 0.58) / 1.35), detectedFace: true };
      }
      case 'forehead': {
        const d = distNorm(forehead);
        return { score: clamp01(1 - Math.max(0, d - 0.58) / 1.35), detectedFace: true };
      }
      case 'nose_mouth': {
        const d = Math.min(distNorm(mouth), distNorm(nose));
        return { score: clamp01(1 - Math.max(0, d - 0.54) / 1.30), detectedFace: true };
      }
      case 'ear': {
        const d = Math.min(distNorm(leftCheek), distNorm(rightCheek));
        return { score: clamp01(1 - Math.max(0, d - 0.58) / 1.35), detectedFace: true };
      }
      case 'eye_cheek': {
        const d = distNorm(faceCenter);
        return { score: clamp01(1 - Math.max(0, d - 0.68) / 1.35), detectedFace: true };
      }
      case 'shoulder': {
        const expectedY = chin.y + faceHeight * 0.45;
        const dy = Math.abs(hand.handCenter.y - expectedY) / faceHeight;
        const dx = Math.abs(hand.handCenter.x - faceCenter.x) / faceWidth;
        const withinY = clamp01(1 - Math.max(0, dy - 0.72) / 1.25);
        const withinX = dx >= 0.4 ? 1 : clamp01(0.65 + dx * 0.8);
        return { score: clamp01(withinY * 0.7 + withinX * 0.3), detectedFace: true };
      }
      case 'chest': {
        const expectedChestY = chin.y + faceHeight * 0.85;
        const dy = Math.abs(hand.handCenter.y - expectedChestY) / faceHeight;
        const dx = Math.abs(hand.handCenter.x - faceCenter.x) / faceWidth;
        const score = clamp01(1 - Math.max(0, dy - 0.9) / 1.45) * clamp01(1 - Math.max(0, dx - 1.55) / 1.8);
        return { score, detectedFace: true };
      }
      case 'neutral_space':
      default: {
        const belowTop = hand.handCenter.y >= nose.y - faceHeight * 0.3 ? 1 : 0.45;
        const centered = clamp01(1 - Math.max(0, Math.abs(wrist.x - faceCenter.x) - faceWidth * 2.3) / 0.5);
        return { score: clamp01(belowTop * 0.75 + centered * 0.25), detectedFace: true };
      }
    }
  }

  const targetY =
    zone === 'forehead'
      ? 0.25
      : zone === 'eye_cheek' || zone === 'ear' || zone === 'nose_mouth'
      ? 0.35
      : zone === 'chin'
      ? 0.42
      : zone === 'shoulder'
      ? 0.52
      : 0.62;

  const dy = Math.abs(hand.handCenter.y - targetY);
  return {
    score: clamp01(1 - Math.max(0, dy - 0.18) / 0.44),
    detectedFace: false
  };
}

function scoreStabilityAndMotion(
  motionType: TargetLandmarks['motionType'],
  recentCenters: RecentHandSample[]
): number {
  if (recentCenters.length < 3) return 0.7;

  const isStaticLike = motionType === 'static' || motionType === 'tap';
  const latestT = recentCenters[recentCenters.length - 1].t;
  const windowed = isStaticLike
    ? recentCenters.filter((s) => latestT - s.t <= 480)
    : recentCenters;
  const samples = windowed.length >= 2 ? windowed : recentCenters;

  let path = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < samples.length; i++) {
    const pt = samples[i];
    const z = pt.z ?? 0;
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    if (i > 0) {
      const prev = samples[i - 1];
      const dz = (pt.z ?? 0) - (prev.z ?? 0);
      path += Math.hypot(pt.x - prev.x, pt.y - prev.y, dz * 0.8);
    }
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const maxSpan = Math.max(spanX, spanY, spanZ * 0.85);

  if (isStaticLike) {
    return clamp01(1 - Math.max(0, path - 0.24) / 0.55);
  }

  if (maxSpan >= 0.022 || path >= 0.032) {
    return clamp01(0.78 + Math.min(0.22, path * 2.5));
  }
  return 0.65;
}

function scoreNonManualExpression(
  expectedNmf: TargetLandmarks['expectedNmf'],
  faceLandmarks?: { x: number; y: number; z?: number }[],
  faceBlendshapes?: { categories?: { categoryName: string; score: number }[] }[]
): { score: number; tip?: string } {
  const nmfMode = expectedNmf ?? 'neutral';
  const face = extractFaceExpressions(faceLandmarks, faceBlendshapes);

  if (!face.detected) {
    // Allow fallback when camera doesn't capture face, but give mild weight
    return { score: nmfMode === 'neutral' ? 0.92 : 0.76 };
  }

  if (nmfMode === 'interrogative_brows_up') {
    const signal = Math.max(face.browRaiseScore, face.headPitchDeg > 4 ? 0.68 : 0);
    if (signal >= 0.28) return { score: clamp01(0.75 + signal * 0.25) };
    return {
      score: clamp01(0.6 + signal * 0.6),
      tip: 'Levante levemente as sobrancelhas para marcar a pergunta.'
    };
  }

  if (nmfMode === 'wh_brows_furrowed') {
    const signal = Math.max(face.browFurrowScore, Math.abs(face.headYawDeg) > 10 ? 0.72 : 0);
    if (signal >= 0.25) return { score: clamp01(0.75 + signal * 0.25) };
    return {
      score: clamp01(0.62 + signal * 0.6),
      tip: 'Franza levemente as sobrancelhas ou negue com a cabeça.'
    };
  }

  if (nmfMode === 'positive_smile') {
    if (face.smileScore >= 0.25) return { score: clamp01(0.8 + face.smileScore * 0.2) };
    return { score: clamp01(0.75 + face.smileScore * 0.4) };
  }

  return { score: 0.96 };
}

export function evaluateSingleTargetSign(params: {
  target: TargetLandmarks;
  handLandmarks: { x: number; y: number; z?: number }[][];
  worldLandmarks?: { x: number; y: number; z?: number }[][];
  handednesses?: HandednessLabel[];
  faceLandmarks?: { x: number; y: number; z?: number }[];
  faceBlendshapes?: { categories?: { categoryName: string; score: number }[] }[];
  recentCenters?: RecentHandSample[];
}): SingleTargetValidationResult {
  const {
    target,
    handLandmarks,
    worldLandmarks,
    handednesses = [],
    faceLandmarks,
    faceBlendshapes,
    recentCenters = []
  } = params;

  if (!handLandmarks || handLandmarks.length === 0 || handLandmarks[0].length < 21) {
    return {
      qualityPercent: 0,
      handshapeScore: 0,
      locationScore: 0,
      stabilityScore: 0,
      nmfScore: 0,
      detectedHands: false,
      detectedFace: Boolean(faceLandmarks && faceLandmarks.length >= 455),
      passed: false,
      tip: 'Mostre sua mão diante da câmera para iniciar.'
    };
  }

  if (target.twoHanded === 2 && handLandmarks.length < 2) {
    const primary = extractHandGeometry(
      handLandmarks[0],
      handednesses[0] || 'Unknown',
      worldLandmarks?.[0]
    );
    const hsEval = scoreSingleHandshape(primary, target);
    const loc = scoreArticulationZone(primary, target.articulationZone, faceLandmarks);
    const qualityPercent = Math.min(68, Math.round((hsEval.score * 0.45 + loc.score * 0.35 + 0.4 * 0.2) * 100));
    return {
      qualityPercent,
      handshapeScore: Math.round(hsEval.score * 100),
      locationScore: Math.round(loc.score * 100),
      stabilityScore: 40,
      nmfScore: 80,
      detectedHands: true,
      detectedFace: loc.detectedFace,
      passed: false,
      tip: 'Este sinal usa as duas mãos. Mostre ambas na câmera.'
    };
  }

  let bestHandshape = 0;
  let bestFingerTip: string | null = null;
  let bestLocation = 0;
  let detectedFace = false;

  handLandmarks.forEach((rawPts, idx) => {
    if (rawPts.length < 21) return;
    const geo = extractHandGeometry(
      rawPts,
      handednesses[idx] || 'Unknown',
      worldLandmarks?.[idx]
    );
    const hsEval = scoreSingleHandshape(geo, target);
    const loc = scoreArticulationZone(geo, target.articulationZone, faceLandmarks);
    detectedFace = detectedFace || loc.detectedFace;

    if (hsEval.score * 0.6 + loc.score * 0.4 >= bestHandshape * 0.6 + bestLocation * 0.4) {
      bestHandshape = hsEval.score;
      bestFingerTip = hsEval.fingerTip;
      bestLocation = loc.score;
    }
  });

  const stability = scoreStabilityAndMotion(target.motionType, recentCenters);
  const nmfEval = scoreNonManualExpression(target.expectedNmf, faceLandmarks, faceBlendshapes);

  const hasExplicitNmf = Boolean(target.expectedNmf && target.expectedNmf !== 'neutral');
  let overall = hasExplicitNmf
    ? bestHandshape * 0.44 + bestLocation * 0.28 + stability * 0.16 + nmfEval.score * 0.12
    : bestHandshape * 0.48 + bestLocation * 0.32 + stability * 0.20;

  if (bestHandshape < 0.55) {
    overall = Math.min(overall, 0.72);
  }
  if (bestLocation < 0.48) {
    overall = Math.min(overall, 0.74);
  }

  const qualityPercent = Math.round(clamp01(overall) * 100);
  const passed = qualityPercent >= 80;

  let tip = 'Excelente! Mantenha o sinal por um instante.';
  if (!passed) {
    if (bestHandshape < 0.72) {
      tip = bestFingerTip || 'Ajuste a configuração dos dedos conforme o modelo.';
    } else if (bestLocation < 0.68) {
      tip = getZoneTip(target.articulationZone);
    } else if (hasExplicitNmf && nmfEval.score < 0.74 && nmfEval.tip) {
      tip = nmfEval.tip;
    } else if (stability < 0.68) {
      tip =
        target.motionType === 'static' || target.motionType === 'tap'
          ? 'Mantenha a mão firme por um instante.'
          : 'Faça o movimento indicado suavemente.';
    } else {
      tip = 'Quase lá! Ajuste levemente a posição da mão.';
    }
  }

  return {
    qualityPercent,
    handshapeScore: Math.round(bestHandshape * 100),
    locationScore: Math.round(bestLocation * 100),
    stabilityScore: Math.round(stability * 100),
    nmfScore: Math.round(nmfEval.score * 100),
    detectedHands: true,
    detectedFace,
    passed,
    tip
  };
}
