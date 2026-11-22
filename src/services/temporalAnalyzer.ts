import {
  HandGeometryFeatures,
  HandKinematics,
  MovementType,
  MultimodalFrameSnapshot,
  Point3D,
  TemporalAnalysisSummary
} from '../types/librasRecognition';
import { clamp01, dist3D, scale3D, sub3D } from './multimodalGeometry';

/**
 * Dynamic Time Warping (DTW) over normalized 3D trajectory sequences.
 * Center-aligns the observed trajectory around its mean so absolute screen offset
 * does not distort shape comparison, and warps non-linearly across execution speeds.
 * Returns a similarity score in [0..1].
 */
export function computeDtwTrajectorySimilarity(
  observed: Point3D[],
  template: Point3D[]
): number {
  if (!observed || observed.length < 3 || !template || template.length < 2) {
    return 0;
  }

  // Center observed around its mean (translation invariance)
  const obsMean = observed.reduce(
    (acc, p) => ({ x: acc.x + p.x / observed.length, y: acc.y + p.y / observed.length, z: acc.z + p.z / observed.length }),
    { x: 0, y: 0, z: 0 }
  );
  const obsCentered = observed.map((p) => sub3D(p, obsMean));

  // Scale-normalize observed trajectory amplitude to match template amplitude
  const obsRadius =
    obsCentered.reduce((acc, p) => acc + Math.hypot(p.x, p.y, p.z), 0) / obsCentered.length;
  const tplMean = template.reduce(
    (acc, p) => ({ x: acc.x + p.x / template.length, y: acc.y + p.y / template.length, z: acc.z + p.z / template.length }),
    { x: 0, y: 0, z: 0 }
  );
  const tplCentered = template.map((p) => sub3D(p, tplMean));
  const tplRadius =
    tplCentered.reduce((acc, p) => acc + Math.hypot(p.x, p.y, p.z), 0) / tplCentered.length;

  // If user didn't actually move when template expects movement, similarity is 0
  if (obsRadius < 0.025 && tplRadius > 0.05) {
    return 0;
  }

  const ratio = obsRadius > 1e-5 ? tplRadius / obsRadius : 1;
  // Softly constrain scaling factor so tiny jitter isn't blown up into big movement
  const clampedScale = Math.min(2.2, Math.max(0.5, ratio));
  const obsNorm = obsCentered.map((p) => scale3D(p, clampedScale));

  const n = obsNorm.length;
  const m = tplCentered.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = dist3D(obsNorm[i - 1], tplCentered[j - 1]);
      dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  const avgCost = dp[n][m] / Math.max(n, m);
  // Convert DTW average normalized Euclidean cost to [0..1] similarity
  const refScale = Math.max(0.08, tplRadius * 1.5);
  return clamp01(Math.exp(-(avgCost * avgCost) / (2 * refScale * refScale)));
}

function countDirectionalZeroCrossings(values: number[], minAmplitude = 0.014): number {
  if (values.length < 4) return 0;
  const deltas: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    if (Math.abs(d) >= minAmplitude) {
      deltas.push(d);
    }
  }
  let crossings = 0;
  for (let i = 1; i < deltas.length; i++) {
    if ((deltas[i] > 0 && deltas[i - 1] < 0) || (deltas[i] < 0 && deltas[i - 1] > 0)) {
      crossings += 1;
    }
  }
  return crossings;
}

function computeCircularSweepRad(points: Point3D[]): number {
  if (points.length < 5) return 0;
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

  let sweep = 0;
  for (let i = 1; i < points.length; i++) {
    const x1 = points[i - 1].x - cx;
    const y1 = points[i - 1].y - cy;
    const x2 = points[i].x - cx;
    const y2 = points[i].y - cy;
    const r1 = Math.hypot(x1, y1);
    const r2 = Math.hypot(x2, y2);
    if (r1 > 0.025 && r2 > 0.025) {
      const cross = x1 * y2 - y1 * x2;
      const dot = x1 * x2 + y1 * y2;
      sweep += Math.atan2(cross, dot);
    }
  }
  return sweep;
}

export function analyzeHandKinematics(
  snapshots: MultimodalFrameSnapshot[],
  handIndexOrSide: 'primary' | 'secondary'
): HandKinematics | null {
  const entries: { t: number; pos: Point3D; openness: number }[] = [];

  for (const snap of snapshots) {
    const hand: HandGeometryFeatures | undefined =
      handIndexOrSide === 'primary' ? snap.hands[0] : snap.hands[1];
    if (!hand) continue;
    const scale = Math.max(0.12, snap.body.bodyScale);
    const bodyRel = scale3D(sub3D(hand.handCenter, snap.body.shoulderMid), 1 / scale);
    entries.push({
      t: snap.timestampMs,
      pos: bodyRel,
      openness: hand.averageFingerOpenness
    });
  }

  if (entries.length < 2) return null;

  const trajectoryBodyNorm = entries.map((e) => e.pos);
  const opennessSeries = entries.map((e) => e.openness);
  const durationMs = Math.max(1, entries[entries.length - 1].t - entries[0].t);

  let totalPathLength = 0;
  let peakSpeed = 0;
  let prevSpeed = 0;
  let accelerationPeak = 0;

  for (let i = 1; i < entries.length; i++) {
    const step = dist3D(entries[i].pos, entries[i - 1].pos);
    const dtSec = Math.max(0.008, (entries[i].t - entries[i - 1].t) / 1000);
    totalPathLength += step;
    const speed = step / dtSec;
    if (speed > peakSpeed) peakSpeed = speed;
    if (i > 1) {
      const accel = Math.abs(speed - prevSpeed) / dtSec;
      if (accel > accelerationPeak) accelerationPeak = accel;
    }
    prevSpeed = speed;
  }

  const first = entries[0].pos;
  const last = entries[entries.length - 1].pos;
  const netDisplacement = sub3D(last, first);
  const netDistance = Math.hypot(netDisplacement.x, netDisplacement.y, netDisplacement.z);
  const meanSpeed = totalPathLength / (durationMs / 1000);

  const lateralZeroCrossings = countDirectionalZeroCrossings(
    trajectoryBodyNorm.map((p) => p.x),
    0.022
  );
  const verticalZeroCrossings = countDirectionalZeroCrossings(
    trajectoryBodyNorm.map((p) => p.y),
    0.018
  );

  const circularSweepRad = computeCircularSweepRad(trajectoryBodyNorm);
  const zApproachDelta = netDisplacement.z;
  const opennessDelta = opennessSeries[opennessSeries.length - 1] - opennessSeries[0];

  const isMoving = totalPathLength > 0.14 || meanSpeed > 0.25;
  const isOscillatingLateral = lateralZeroCrossings >= 1 && totalPathLength > 0.22;
  const isOscillatingVertical = verticalZeroCrossings >= 1 && totalPathLength > 0.16;
  const isCircular = Math.abs(circularSweepRad) >= 1.6 && totalPathLength > 0.22;

  let dominantMovement: MovementType = 'static';
  if (Math.abs(opennessDelta) > 0.25 && opennessDelta < 0) {
    dominantMovement = 'closing_grasp';
  } else if (isCircular) {
    dominantMovement = 'circular_air';
  } else if (isOscillatingLateral) {
    dominantMovement = 'oscillating_lateral';
  } else if (isOscillatingVertical) {
    dominantMovement = 'nodding_vertical';
  } else if (zApproachDelta < -0.09 || (netDisplacement.y > 0.08 && Math.abs(netDisplacement.x) < 0.2)) {
    dominantMovement = 'forward_away';
  } else if (zApproachDelta > 0.08) {
    dominantMovement = 'towards_body';
  }

  return {
    sampleCount: entries.length,
    durationMs,
    trajectoryBodyNorm,
    opennessSeries,
    netDisplacement,
    netDistance,
    totalPathLength,
    meanSpeed,
    peakSpeed,
    accelerationPeak,
    lateralZeroCrossings,
    verticalZeroCrossings,
    circularSweepRad,
    zApproachDelta,
    opennessDelta,
    isMoving,
    isOscillatingLateral,
    isOscillatingVertical,
    isCircular,
    dominantMovement
  };
}

export class TemporalMotionBuffer {
  private frames: MultimodalFrameSnapshot[] = [];
  private readonly maxFrames: number;
  private readonly maxWindowMs: number;

  constructor(maxFrames = 36, maxWindowMs = 1500) {
    this.maxFrames = maxFrames;
    this.maxWindowMs = maxWindowMs;
  }

  public push(snapshot: MultimodalFrameSnapshot): void {
    this.frames.push(snapshot);
    const cutoff = snapshot.timestampMs - this.maxWindowMs;
    while (this.frames.length > this.maxFrames || (this.frames.length > 0 && this.frames[0].timestampMs < cutoff)) {
      this.frames.shift();
    }
  }

  public clear(): void {
    this.frames = [];
  }

  public getFrames(): MultimodalFrameSnapshot[] {
    return this.frames;
  }

  public summarize(): TemporalAnalysisSummary {
    const frameCount = this.frames.length;
    if (frameCount === 0) {
      return {
        frameCount: 0,
        durationMs: 0,
        primaryHandKinematics: null,
        secondaryHandKinematics: null,
        twoHandDistanceAvg: null,
        twoHandTipDistanceAvg: null,
        twoHandAlternatingScore: 0,
        headShakeCycles: 0,
        headNodCycles: 0
      };
    }

    const durationMs = Math.max(0, this.frames[frameCount - 1].timestampMs - this.frames[0].timestampMs);
    const primaryHandKinematics = analyzeHandKinematics(this.frames, 'primary');
    const secondaryHandKinematics = analyzeHandKinematics(this.frames, 'secondary');

    // Compute two-hand coordination metrics across recent frames where both hands are present
    const recentTwoHand = this.frames.slice(-12).filter((f) => f.hands.length >= 2);
    let twoHandDistanceAvg: number | null = null;
    let twoHandTipDistanceAvg: number | null = null;
    let twoHandAlternatingScore = 0;

    if (recentTwoHand.length > 0) {
      let sumWristDist = 0;
      let sumTipDist = 0;
      for (const f of recentTwoHand) {
        const h1 = f.hands[0];
        const h2 = f.hands[1];
        const avgPalm = Math.max(0.03, (h1.palmScale + h2.palmScale) / 2);
        sumWristDist += dist3D(h1.landmarks[0], h2.landmarks[0]) / avgPalm;
        sumTipDist += dist3D(h1.landmarks[8], h2.landmarks[8]) / avgPalm;
      }
      twoHandDistanceAvg = sumWristDist / recentTwoHand.length;
      twoHandTipDistanceAvg = sumTipDist / recentTwoHand.length;

      if (primaryHandKinematics && secondaryHandKinematics) {
        const bothMoving = primaryHandKinematics.isMoving && secondaryHandKinematics.isMoving;
        if (bothMoving) {
          twoHandAlternatingScore = clamp01(
            (primaryHandKinematics.totalPathLength + secondaryHandKinematics.totalPathLength) / 0.8
          );
        }
      }
    }

    // Head NMF oscillation detection
    const faceFrames = this.frames.filter((f) => f.face.detected);
    const headShakeCycles = countDirectionalZeroCrossings(
      faceFrames.map((f) => f.face.headYawDeg),
      5.0
    );
    const headNodCycles = countDirectionalZeroCrossings(
      faceFrames.map((f) => f.face.headPitchDeg),
      4.0
    );

    return {
      frameCount,
      durationMs,
      primaryHandKinematics,
      secondaryHandKinematics,
      twoHandDistanceAvg,
      twoHandTipDistanceAvg,
      twoHandAlternatingScore,
      headShakeCycles,
      headNodCycles
    };
  }
}
