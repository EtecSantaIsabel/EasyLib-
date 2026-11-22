import {
  HoldToConfirmState,
  LibrasSignSpecification,
  RecognitionEvaluation
} from '../types/librasRecognition';

export interface HoldToConfirmConfig {
  holdDurationMs: number;
  releaseNeutralFramesRequired: number;
}

export const DEFAULT_HOLD_CONFIG: HoldToConfirmConfig = {
  holdDurationMs: 650,
  releaseNeutralFramesRequired: 4
};

export function createInitialHoldState(): HoldToConfirmState {
  return {
    candidateSignId: null,
    startedAtMs: null,
    elapsedMs: 0,
    progressPercent: 0,
    confirmedSignId: null,
    lockedUntilNeutral: false,
    neutralFramesSinceConfirm: 0
  };
}

export interface HoldStepResult {
  nextState: HoldToConfirmState;
  newlyConfirmedSign: LibrasSignSpecification | null;
}

/**
 * Pure state-machine step for Hold-to-Confirm.
 * Guarantees:
 * 1. Progress fills 0% -> 100% only while the exact same validated sign stays above threshold.
 * 2. Resets immediately if tracking is lost, confidence drops below threshold, or sign changes.
 * 3. Registers a sign ONLY once per sustained gesture (anti-duplicate lock until neutral release).
 */
export function stepHoldToConfirm(
  prevState: HoldToConfirmState,
  evaluation: RecognitionEvaluation,
  nowMs: number,
  config: HoldToConfirmConfig = DEFAULT_HOLD_CONFIG
): HoldStepResult {
  // 1. Tracking lost or insufficient temporal buffer -> immediate reset
  if (evaluation.status === 'no_hands' || evaluation.status === 'insufficient_frames') {
    return {
      nextState: createInitialHoldState(),
      newlyConfirmedSign: null
    };
  }

  // 2. Below confidence threshold -> reset hold progress & count neutral frames to unlock repeat
  if (evaluation.status === 'below_threshold' || !evaluation.sign) {
    const neutralCount = prevState.lockedUntilNeutral
      ? prevState.neutralFramesSinceConfirm + 1
      : 0;
    const stillLocked =
      prevState.lockedUntilNeutral && neutralCount < config.releaseNeutralFramesRequired;

    return {
      nextState: {
        candidateSignId: null,
        startedAtMs: null,
        elapsedMs: 0,
        progressPercent: 0,
        confirmedSignId: stillLocked ? prevState.confirmedSignId : null,
        lockedUntilNeutral: stillLocked,
        neutralFramesSinceConfirm: stillLocked ? neutralCount : 0
      },
      newlyConfirmedSign: null
    };
  }

  const detectedId = evaluation.sign.id;

  // 3. If user is still holding the already-confirmed sign, keep locked (0 duplicate triggers!)
  if (prevState.lockedUntilNeutral && prevState.confirmedSignId === detectedId) {
    return {
      nextState: {
        ...prevState,
        candidateSignId: detectedId,
        progressPercent: 100,
        neutralFramesSinceConfirm: 0
      },
      newlyConfirmedSign: null
    };
  }

  // 4. If sign changed from previous candidate (or unlocked to a new sign) -> restart timer cleanly
  if (prevState.candidateSignId !== detectedId || prevState.startedAtMs === null) {
    return {
      nextState: {
        candidateSignId: detectedId,
        startedAtMs: nowMs,
        elapsedMs: 0,
        progressPercent: 5,
        confirmedSignId: null,
        lockedUntilNeutral: false,
        neutralFramesSinceConfirm: 0
      },
      newlyConfirmedSign: null
    };
  }

  // 5. Same candidate sign held consistently -> advance timer
  const elapsedMs = Math.max(0, nowMs - prevState.startedAtMs);
  const progressPercent = Math.min(
    100,
    Math.round((elapsedMs / Math.max(100, config.holdDurationMs)) * 100)
  );

  if (elapsedMs >= config.holdDurationMs) {
    return {
      nextState: {
        candidateSignId: detectedId,
        startedAtMs: prevState.startedAtMs,
        elapsedMs,
        progressPercent: 100,
        confirmedSignId: detectedId,
        lockedUntilNeutral: true,
        neutralFramesSinceConfirm: 0
      },
      newlyConfirmedSign: evaluation.sign
    };
  }

  return {
    nextState: {
      ...prevState,
      elapsedMs,
      progressPercent
    },
    newlyConfirmedSign: null
  };
}
