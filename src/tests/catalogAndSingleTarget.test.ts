import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findCatalogSign,
  LIBRAS_CATALOG_255,
  LIBRAS_CATALOG_CATEGORIES
} from '../data/librasCatalog255';
import {
  getActivityNodeId,
  getExercisesForActivity,
  getTrackUnlockState,
  getUnitsForSection,
  LIBRAS_SECTIONS,
  TRACK_STRUCTURE
} from '../data/librasData';
import { getSignEditorialDetail } from '../data/signEditorialDetails';
import {
  generateCandidateRoomCode,
  isValidRoomCodeFormat,
  normalizeRoomCode
} from '../services/roomCodeUtils';
import { evaluateSingleTargetSign } from '../services/singleTargetValidator';
import { HandednessLabel, PalmFacing, Point3D } from '../types/librasRecognition';

interface SyntheticFingerSpec {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  indexSpreadDeg?: number;
  thumbSpreadDeg?: number;
  thumbCrossInward?: boolean;
}

function rotateForFacing(local: Point3D, facing: PalmFacing, handedness: HandednessLabel): Point3D {
  const { x, y, z } = local;
  switch (facing) {
    case 'camera':
      return { x, y, z };
    case 'signer':
      return { x: -x, y, z: -z };
    case 'up':
      return { x, y: z, z: -y };
    case 'down':
      return { x, y: -z, z: y };
    case 'inward':
      return handedness === 'Right' ? { x: -z, y, z: x } : { x: z, y, z: -x };
    case 'outward':
      return handedness === 'Right' ? { x: z, y, z: -x } : { x: -z, y, z: x };
    default:
      return { x, y, z };
  }
}

function buildFinger(
  mcp: Point3D,
  dirUp: Point3D,
  palmNormal: Point3D,
  extension: number,
  palmScale: number,
  lengthFactor: number
): [Point3D, Point3D, Point3D] {
  const seg1 = palmScale * 0.34 * lengthFactor;
  const seg2 = palmScale * 0.24 * lengthFactor;
  const seg3 = palmScale * 0.20 * lengthFactor;

  const bend1 = (1 - extension) * 1.45;
  const bend2 = (1 - extension) * 2.95;
  const bend3 = (1 - extension) * 4.35;

  const step = (origin: Point3D, angle: number, len: number): Point3D => ({
    x: origin.x + (dirUp.x * Math.cos(angle) + palmNormal.x * Math.sin(angle)) * len,
    y: origin.y + (dirUp.y * Math.cos(angle) + palmNormal.y * Math.sin(angle)) * len,
    z: origin.z + (dirUp.z * Math.cos(angle) + palmNormal.z * Math.sin(angle)) * len
  });

  const pip = step(mcp, bend1, seg1);
  const dip = step(pip, bend2, seg2);
  const tip = step(dip, bend3, seg3);
  return [pip, dip, tip];
}

function makeHandLandmarks(opts: {
  wristPos: Point3D;
  palmScale?: number;
  facing?: PalmFacing;
  handedness?: HandednessLabel;
  spec: SyntheticFingerSpec;
}): Point3D[] {
  const {
    wristPos,
    palmScale = 0.095,
    facing = 'camera',
    handedness = 'Right',
    spec
  } = opts;
  const sideSign = handedness === 'Right' ? -1 : 1;

  const xf = (lx: number, ly: number, lz = 0): Point3D => {
    const r = rotateForFacing(
      { x: lx * palmScale, y: ly * palmScale, z: lz * palmScale },
      facing,
      handedness
    );
    return { x: wristPos.x + r.x, y: wristPos.y + r.y, z: wristPos.z + r.z };
  };

  const wrist = { ...wristPos };
  const indexMcp = xf(sideSign * 0.34, -0.92, 0);
  const middleMcp = xf(sideSign * 0.08, -1.0, 0);
  const ringMcp = xf(-sideSign * 0.16, -0.96, 0);
  const pinkyMcp = xf(-sideSign * 0.38, -0.88, 0);

  const palmDir = rotateForFacing({ x: 0, y: 0, z: -1 }, facing, handedness);
  const spreadRad = ((spec.indexSpreadDeg ?? 8) * Math.PI) / 180;

  const indexUp = rotateForFacing(
    { x: Math.sin(spreadRad) * sideSign, y: -Math.cos(spreadRad), z: 0 },
    facing,
    handedness
  );
  const middleUp = rotateForFacing(
    { x: -Math.sin(spreadRad * 0.4) * sideSign, y: -Math.cos(spreadRad * 0.4), z: 0 },
    facing,
    handedness
  );
  const ringUp = rotateForFacing({ x: -sideSign * 0.08, y: -0.99, z: 0 }, facing, handedness);
  const pinkyUp = rotateForFacing({ x: -sideSign * 0.16, y: -0.98, z: 0 }, facing, handedness);

  const [idxPip, idxDip, idxTip] = buildFinger(indexMcp, indexUp, palmDir, spec.index, palmScale, 1.0);
  const [midPip, midDip, midTip] = buildFinger(middleMcp, middleUp, palmDir, spec.middle, palmScale, 1.08);
  const [rngPip, rngDip, rngTip] = buildFinger(ringMcp, ringUp, palmDir, spec.ring, palmScale, 1.0);
  const [pnkPip, pnkDip, pnkTip] = buildFinger(pinkyMcp, pinkyUp, palmDir, spec.pinky, palmScale, 0.82);

  const thumbCmc = xf(sideSign * 0.32, -0.30, -0.04);
  const thumbMcp = xf(sideSign * 0.56, -0.52, -0.06);
  const thumbAngleRad = ((spec.thumbSpreadDeg ?? 48) * Math.PI) / 180;
  let thumbLocal: Point3D;
  if (spec.thumbCrossInward) {
    thumbLocal = { x: -sideSign * 0.65, y: -0.45, z: -0.55 };
  } else if (spec.thumb >= 0.7) {
    thumbLocal = {
      x: sideSign * Math.sin(thumbAngleRad),
      y: -Math.cos(thumbAngleRad),
      z: -0.05
    };
  } else {
    thumbLocal = { x: sideSign * 0.15, y: -0.82, z: -0.5 };
  }
  const tLen = Math.hypot(thumbLocal.x, thumbLocal.y, thumbLocal.z);
  const thumbUnit = rotateForFacing(
    { x: thumbLocal.x / tLen, y: thumbLocal.y / tLen, z: thumbLocal.z / tLen },
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

  return [
    wrist,
    thumbCmc,
    thumbMcp,
    thumbIp,
    thumbTip,
    indexMcp,
    idxPip,
    idxDip,
    idxTip,
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
}

function makeFaceLandmarks(center: Point3D = { x: 0.5, y: 0.27, z: 0 }, faceScale = 0.16): Point3D[] {
  const face: Point3D[] = Array.from({ length: 468 }, () => ({ ...center }));
  face[10] = { x: center.x, y: center.y - faceScale * 0.55, z: 0 };
  face[152] = { x: center.x, y: center.y + faceScale * 0.55, z: 0 };
  face[1] = { x: center.x, y: center.y, z: -0.04 };
  face[13] = { x: center.x, y: center.y + faceScale * 0.22, z: 0 };
  face[234] = { x: center.x - faceScale * 0.42, y: center.y, z: 0 };
  face[454] = { x: center.x + faceScale * 0.42, y: center.y, z: 0 };
  return face;
}

test('1. Catálogo possui exatamente 255 sinais do libras.se com slugs únicos e URLs corretas', () => {
  assert.equal(LIBRAS_CATALOG_255.length, 255);
  assert.ok(LIBRAS_CATALOG_CATEGORIES.length >= 10);

  const uniqueIds = new Set(LIBRAS_CATALOG_255.map((s) => s.id));
  const uniqueSlugs = new Set(LIBRAS_CATALOG_255.map((s) => s.slug));
  assert.equal(uniqueIds.size, 255);
  assert.equal(uniqueSlugs.size, 255);

  LIBRAS_CATALOG_255.forEach((sign, idx) => {
    assert.equal(sign.numericId, idx + 1);
    assert.ok(sign.palavra.length > 0);
    assert.ok(sign.significado.length > 0);
    assert.ok(LIBRAS_CATALOG_CATEGORIES.includes(sign.categoria));
    assert.equal(sign.videoUrl, `https://libras.se/assets/videos/sinais/${sign.slug}.mp4`);
    assert.ok(sign.targetLandmarks.handshapeId);
    assert.ok(sign.schematicHint.handshapeId);
  });
});

test('2. Validador de sinal único rejeita quando nenhuma mão é detectada', () => {
  const maeSign = findCatalogSign('mae');
  const res = evaluateSingleTargetSign({
    target: maeSign.targetLandmarks,
    handLandmarks: [],
    faceLandmarks: makeFaceLandmarks()
  });

  assert.equal(res.detectedHands, false);
  assert.equal(res.qualityPercent, 0);
  assert.equal(res.passed, false);
});

test('3. Validador aprova (>= 80%) quando configuração de mão e ponto de articulação correspondem ao sinal alvo', () => {
  const face = makeFaceLandmarks();

  // mae: flat_b at chin
  const maeSign = findCatalogSign('mae');
  const maeHand = makeHandLandmarks({
    wristPos: { x: 0.5, y: 0.43, z: -0.04 },
    facing: 'signer',
    spec: { thumb: 0.4, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
  });
  const maeRes = evaluateSingleTargetSign({
    target: maeSign.targetLandmarks,
    handLandmarks: [maeHand],
    handednesses: ['Right'],
    faceLandmarks: face,
    recentCenters: [
      { x: 0.5, y: 0.37, t: 100 },
      { x: 0.5, y: 0.37, t: 180 },
      { x: 0.5, y: 0.37, t: 260 }
    ]
  });
  assert.equal(maeRes.passed, true, `Esperava aprovação em Mãe, obteve ${maeRes.qualityPercent}% (${maeRes.tip})`);
  assert.ok(maeRes.qualityPercent >= 80);

  // entender: point_1 at forehead
  const entenderSign = findCatalogSign('entender');
  const entenderHand = makeHandLandmarks({
    wristPos: { x: 0.52, y: 0.27, z: -0.04 },
    facing: 'inward',
    spec: { thumb: 0.1, index: 1, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
  });
  const entenderRes = evaluateSingleTargetSign({
    target: entenderSign.targetLandmarks,
    handLandmarks: [entenderHand],
    handednesses: ['Right'],
    faceLandmarks: face,
    recentCenters: [
      { x: 0.52, y: 0.22, t: 100 },
      { x: 0.52, y: 0.22, t: 180 },
      { x: 0.52, y: 0.22, t: 260 }
    ]
  });
  assert.equal(entenderRes.passed, true, `Esperava aprovação em Entender, obteve ${entenderRes.qualityPercent}%`);
  assert.ok(entenderRes.qualityPercent >= 80);

  // oi: open_5 at shoulder with wave motion
  const oiSign = findCatalogSign('oi');
  const oiHand = makeHandLandmarks({
    wristPos: { x: 0.36, y: 0.44, z: -0.04 },
    facing: 'camera',
    spec: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 16 }
  });
  const oiRes = evaluateSingleTargetSign({
    target: oiSign.targetLandmarks,
    handLandmarks: [oiHand],
    handednesses: ['Right'],
    faceLandmarks: face,
    recentCenters: [
      { x: 0.33, y: 0.39, t: 100 },
      { x: 0.39, y: 0.39, t: 200 },
      { x: 0.34, y: 0.39, t: 300 }
    ]
  });
  assert.equal(oiRes.passed, true, `Esperava aprovação em Oi, obteve ${oiRes.qualityPercent}%`);
});

test('4. Guardrails bloqueiam (< 80%) quando a mão ou o local estão errados e exigem 2 mãos quando aplicável', () => {
  const face = makeFaceLandmarks();
  const maeSign = findCatalogSign('mae');

  // Wrong handshape (closed fist at chin) -> must fail
  const wrongHandshape = makeHandLandmarks({
    wristPos: { x: 0.5, y: 0.43, z: -0.04 },
    facing: 'camera',
    spec: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0, thumbCrossInward: true }
  });
  const resWrongHand = evaluateSingleTargetSign({
    target: maeSign.targetLandmarks,
    handLandmarks: [wrongHandshape],
    handednesses: ['Right'],
    faceLandmarks: face
  });
  assert.equal(resWrongHand.passed, false);
  assert.ok(resWrongHand.qualityPercent < 80);

  // Wrong location (correct flat_b hand down at chest instead of chin) -> must fail
  const wrongLocation = makeHandLandmarks({
    wristPos: { x: 0.5, y: 0.78, z: -0.04 },
    facing: 'camera',
    spec: { thumb: 0.4, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
  });
  const resWrongLoc = evaluateSingleTargetSign({
    target: maeSign.targetLandmarks,
    handLandmarks: [wrongLocation],
    handednesses: ['Right'],
    faceLandmarks: face
  });
  assert.equal(resWrongLoc.passed, false);
  assert.ok(resWrongLoc.qualityPercent < 80);
  assert.ok(resWrongLoc.tip.toLowerCase().includes('queixo'));

  // Two-handed sign (casa) with only 1 visible hand -> must fail and ask for 2 hands
  const casaSign = findCatalogSign('casa');
  const oneHand = makeHandLandmarks({
    wristPos: { x: 0.44, y: 0.52, z: -0.04 },
    facing: 'inward',
    handedness: 'Right',
    spec: { thumb: 0.5, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
  });
  const resOneHandCasa = evaluateSingleTargetSign({
    target: casaSign.targetLandmarks,
    handLandmarks: [oneHand],
    handednesses: ['Right'],
    faceLandmarks: face
  });
  assert.equal(resOneHandCasa.passed, false);
  assert.ok(resOneHandCasa.tip.toLowerCase().includes('duas mãos'));

  // Both hands present -> passes
  const secondHand = makeHandLandmarks({
    wristPos: { x: 0.56, y: 0.52, z: -0.04 },
    facing: 'inward',
    handedness: 'Left',
    spec: { thumb: 0.5, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
  });
  const resTwoHandCasa = evaluateSingleTargetSign({
    target: casaSign.targetLandmarks,
    handLandmarks: [oneHand, secondHand],
    handednesses: ['Right', 'Left'],
    faceLandmarks: face,
    recentCenters: [
      { x: 0.44, y: 0.47, t: 100 },
      { x: 0.44, y: 0.47, t: 200 },
      { x: 0.44, y: 0.47, t: 300 }
    ]
  });
  assert.equal(resTwoHandCasa.passed, true, `Esperava aprovação em Casa com 2 mãos, obteve ${resTwoHandCasa.qualityPercent}%`);
});

test('5. Trilha segue estrutura 10 seções × 20 etapas × 12 atividades × 5 exercícios sob demanda', () => {
  assert.equal(TRACK_STRUCTURE.sections, 10);
  assert.equal(TRACK_STRUCTURE.stagesPerSection, 20);
  assert.equal(TRACK_STRUCTURE.activitiesPerStage, 12);
  assert.equal(TRACK_STRUCTURE.exercisesPerActivity, 5);
  assert.equal(LIBRAS_SECTIONS.length, 10);

  for (let s = 1; s <= TRACK_STRUCTURE.sections; s++) {
    const units = getUnitsForSection(s);
    assert.equal(units.length, 20, `Seção ${s} deveria ter 20 etapas`);
    for (const unit of units) {
      assert.equal(unit.nodes.length, 12, `${unit.id} deveria ter 12 atividades`);
    }
  }

  // Spot-check odd and even activities across different sections
  const oddExercises = getExercisesForActivity(1, 1, 1);
  assert.equal(oddExercises.length, 5);
  assert.deepEqual(
    oddExercises.map((e) => e.type),
    ['new_sign_cards', 'slow_reading', 'match_sign_pairs', 'camera_practice', 'translate_to_libras']
  );
  assert.equal(oddExercises[0].isNewSign, true);
  assert.ok((oddExercises[0].signMeaning ?? '').length > 0);
  assert.equal(oddExercises[0].options?.length, 4);
  assert.equal(oddExercises[2].matchPairs?.length, 4);

  const evenExercises = getExercisesForActivity(3, 5, 2);
  assert.equal(evenExercises.length, 5);
  assert.deepEqual(
    evenExercises.map((e) => e.type),
    ['new_sign_cards', 'slow_reading', 'dactylology_spelling', 'camera_practice', 'dialogue_completion']
  );
  assert.equal(evenExercises[0].isNewSign, true);
  assert.ok((evenExercises[0].signMeaning ?? '').length > 0);
});

test('6. Validador avalia Expressões Não-Manuais (ENM) via faceBlendshapes e emite dica facial quando necessário', () => {
  const tudoBemSign = findCatalogSign('tudo-bem');
  const face = makeFaceLandmarks();
  const hand = makeHandLandmarks({
    wristPos: { x: 0.45, y: 0.56, z: -0.04 },
    facing: 'camera',
    spec: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0 }
  });

  const flatBrows = evaluateSingleTargetSign({
    target: tudoBemSign.targetLandmarks,
    handLandmarks: [hand],
    handednesses: ['Right'],
    faceLandmarks: face,
    faceBlendshapes: [
      {
        categories: [
          { categoryName: 'browInnerUp', score: 0.02 },
          { categoryName: 'browOuterUpLeft', score: 0.02 },
          { categoryName: 'browOuterUpRight', score: 0.02 }
        ]
      }
    ],
    recentCenters: [
      { x: 0.45, y: 0.50, t: 100 },
      { x: 0.45, y: 0.51, t: 200 },
      { x: 0.45, y: 0.50, t: 300 }
    ]
  });

  const raisedBrows = evaluateSingleTargetSign({
    target: tudoBemSign.targetLandmarks,
    handLandmarks: [hand],
    handednesses: ['Right'],
    faceLandmarks: face,
    faceBlendshapes: [
      {
        categories: [
          { categoryName: 'browInnerUp', score: 0.78 },
          { categoryName: 'browOuterUpLeft', score: 0.72 },
          { categoryName: 'browOuterUpRight', score: 0.74 }
        ]
      }
    ],
    recentCenters: [
      { x: 0.45, y: 0.50, t: 100 },
      { x: 0.45, y: 0.51, t: 200 },
      { x: 0.45, y: 0.50, t: 300 }
    ]
  });

  assert.ok(raisedBrows.nmfScore > flatBrows.nmfScore);
  assert.ok(raisedBrows.nmfScore >= 85);
});

test('7. Progressão sequencial estrita bloqueia atividades, etapas e seções futuras até conclusão anterior', () => {
  const initialState = getTrackUnlockState([]);
  assert.equal(initialState.isActivityUnlocked(1, 1, 1), true);
  assert.equal(initialState.isActivityUnlocked(1, 1, 2), false);
  assert.equal(initialState.isStageUnlocked(1, 1), true);
  assert.equal(initialState.isStageUnlocked(1, 2), false);
  assert.equal(initialState.isSectionUnlocked(1), true);
  assert.equal(initialState.isSectionUnlocked(2), false);

  const afterOneActivity = getTrackUnlockState([getActivityNodeId(1, 1, 1)]);
  assert.equal(afterOneActivity.isActivityUnlocked(1, 1, 2), true);
  assert.equal(afterOneActivity.isActivityUnlocked(1, 1, 3), false);
  assert.equal(afterOneActivity.isStageUnlocked(1, 2), false);

  const stage1CompletedIds = Array.from({ length: 12 }, (_, idx) =>
    getActivityNodeId(1, 1, idx + 1)
  );
  const afterStage1 = getTrackUnlockState(stage1CompletedIds);
  assert.equal(afterStage1.isStageCompleted(1, 1), true);
  assert.equal(afterStage1.isStageUnlocked(1, 2), true);
  assert.equal(afterStage1.isActivityUnlocked(1, 2, 1), true);
  assert.equal(afterStage1.isActivityUnlocked(1, 2, 2), false);
  assert.equal(afterStage1.isSectionUnlocked(2), false);

  const section1CompletedIds: string[] = [];
  for (let stage = 1; stage <= 20; stage++) {
    for (let act = 1; act <= 12; act++) {
      section1CompletedIds.push(getActivityNodeId(1, stage, act));
    }
  }
  const afterSection1 = getTrackUnlockState(section1CompletedIds);
  assert.equal(afterSection1.isSectionCompleted(1), true);
  assert.equal(afterSection1.isSectionUnlocked(2), true);
  assert.equal(afterSection1.isStageUnlocked(2, 1), true);
  assert.equal(afterSection1.isActivityUnlocked(2, 1, 1), true);
  assert.equal(afterSection1.isSectionUnlocked(3), false);
});

test('8. Página de detalhe editorial gera metadados limpos, 3 exemplos e 4 sinais relacionados para todos os 255 sinais', () => {
  for (const sign of LIBRAS_CATALOG_255) {
    const detail = getSignEditorialDetail(sign);
    assert.ok(detail.grammaticalClass.length > 0);
    assert.ok(detail.usageContext.length > 0);
    assert.equal(detail.definitions.length, 2);
    assert.equal(detail.examples.length, 3);
    assert.equal(detail.relatedSigns.length, 4);
    assert.ok(!detail.relatedSigns.some((r) => r.id === sign.id));
    assert.ok(!detail.howToMake.handshapeText.includes(sign.targetLandmarks.handshapeId));
    assert.ok(!detail.howToMake.handshapeText.toLowerCase().includes('não fechada neutra'));
  }
});

test('9. Validação de código único de sala fechada rejeita formatos inválidos e normaliza códigos válidos', () => {
  assert.equal(normalizeRoomCode('  lib-7k9  '), 'LIB7K9');
  assert.equal(isValidRoomCodeFormat('LIB7K9'), true);
  assert.equal(isValidRoomCodeFormat('abc12345'), true);
  assert.equal(isValidRoomCodeFormat(''), false);
  assert.equal(isValidRoomCodeFormat('123'), false);
  assert.equal(isValidRoomCodeFormat('LIB!@#'), false);
  assert.equal(isValidRoomCodeFormat('CODIGOMUITOGRANDE123'), false);

  const generated = generateCandidateRoomCode(6);
  assert.equal(generated.length, 6);
  assert.equal(isValidRoomCodeFormat(generated), true);
});

test('10. Validador usa worldLandmarks 3D, movimento Z (para frente) e janela curta de estabilidade (480ms)', () => {
  const face = makeFaceLandmarks();

  // OBRIGADO: flat_b at chin moving forward along Z-axis (-0.01 -> -0.14) with 3D worldLandmarks
  const obrigadoSign = findCatalogSign('obrigado');
  const obrigadoHand2D = makeHandLandmarks({
    wristPos: { x: 0.5, y: 0.43, z: -0.05 },
    facing: 'signer',
    spec: { thumb: 0.4, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
  });
  const obrigadoWorld = makeHandLandmarks({
    wristPos: { x: 0, y: 0, z: 0 },
    palmScale: 0.085,
    facing: 'signer',
    spec: { thumb: 0.4, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
  });

  const obrigadoRes = evaluateSingleTargetSign({
    target: obrigadoSign.targetLandmarks,
    handLandmarks: [obrigadoHand2D],
    worldLandmarks: [obrigadoWorld],
    handednesses: ['Right'],
    faceLandmarks: face,
    recentCenters: [
      { x: 0.5, y: 0.37, z: -0.01, t: 100 },
      { x: 0.5, y: 0.38, z: -0.07, t: 220 },
      { x: 0.5, y: 0.39, z: -0.14, t: 340 }
    ]
  });
  assert.equal(
    obrigadoRes.passed,
    true,
    `Esperava aprovação em Obrigado com movimento Z, obteve ${obrigadoRes.qualityPercent}% (${obrigadoRes.tip})`
  );
  assert.ok(obrigadoRes.stabilityScore >= 78);

  // MÃE (static): hand enters frame at t=50..120 then stabilizes inside last 480ms (t=620..860)
  const maeSign = findCatalogSign('mae');
  const maeHand = makeHandLandmarks({
    wristPos: { x: 0.5, y: 0.43, z: -0.04 },
    facing: 'signer',
    spec: { thumb: 0.4, index: 1, middle: 1, ring: 1, pinky: 1, indexSpreadDeg: 5 }
  });
  const maeRes = evaluateSingleTargetSign({
    target: maeSign.targetLandmarks,
    handLandmarks: [maeHand],
    handednesses: ['Right'],
    faceLandmarks: face,
    recentCenters: [
      { x: 0.25, y: 0.72, z: 0, t: 50 },
      { x: 0.39, y: 0.54, z: -0.02, t: 120 },
      { x: 0.5, y: 0.37, z: -0.04, t: 620 },
      { x: 0.5, y: 0.37, z: -0.04, t: 740 },
      { x: 0.5, y: 0.37, z: -0.04, t: 860 }
    ]
  });
  assert.equal(maeRes.passed, true, `MÃE deveria aprovar após entrada inicial: ${maeRes.stabilityScore}%`);
  assert.ok(maeRes.stabilityScore >= 90);
});


