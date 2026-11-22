// Multimodal Libras Recognition, Biomechanics & Linguistic Types

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type HandednessLabel = 'Left' | 'Right' | 'Unknown';

export type PalmFacing =
  | 'camera'       // Palma voltada para frente / interlocutor
  | 'signer'       // Palma voltada para o próprio sinalizador
  | 'up'           // Palma voltada para cima
  | 'down'         // Palma voltada para baixo
  | 'inward'       // Palma voltada medialmente (para o centro do corpo)
  | 'outward'      // Palma voltada lateralmente (para fora)
  | 'any';

export type BodyZone =
  | 'forehead'       // Testa
  | 'temple'         // Têmpora / lateral da testa
  | 'ear'            // Orelha / ouvido
  | 'eye_cheek'      // Olho / bochecha
  | 'nose_mouth'     // Nariz / boca
  | 'chin'           // Queixo
  | 'neck_shoulder'  // Pescoço / ombro
  | 'chest'          // Peito / tórax
  | 'neutral_space'  // Espaço neutro à frente do tronco
  | 'above_shoulder' // Acima da linha do ombro (aceno/espaço superior)
  | 'waist_low';     // Região baixa / descanso

export type MovementType =
  | 'static'
  | 'oscillating_lateral'
  | 'nodding_vertical'
  | 'forward_away'
  | 'towards_body'
  | 'circular_chest'
  | 'circular_air'
  | 'ear_to_mouth'
  | 'repetitive_to_mouth'
  | 'closing_grasp'
  | 'two_hand_roof'
  | 'two_hand_contact'
  | 'two_hand_support'
  | 'two_hand_alternating';

export type NmfExpressionType =
  | 'neutral'
  | 'interrogative_brows_up'
  | 'wh_brows_furrowed'
  | 'negative_head_shake'
  | 'affirmative_nod'
  | 'positive_smile'
  | 'any';

export interface FingerJointAngles {
  mcpAngleDeg: number; // Base knuckle flexion
  pipAngleDeg: number; // Middle joint flexion
  dipAngleDeg: number; // Tip joint flexion
  extensionScore: number; // 0 (fully curled) .. 1 (fully straight)
  curlScore: number;      // 1 - extensionScore
}

export interface HandGeometryFeatures {
  handedness: HandednessLabel;
  landmarks: Point3D[];
  wristRelative: Point3D[]; // 21 points normalized by palmScale & translated to wrist
  palmScale: number;        // 3D distance wrist -> middle_mcp
  palmWidth: number;        // 3D distance index_mcp -> pinky_mcp
  handCenter: Point3D;      // Midpoint of palm
  palmNormal: Point3D;      // Unit normal vector of the palm plane
  palmUpVector: Point3D;    // Unit vector wrist -> middle_mcp
  palmRightVector: Point3D; // Unit vector across palm
  palmFacing: PalmFacing;
  handRollDeg: number;      // Rotation around camera Z
  handPitchDeg: number;     // Tilt toward/away from camera
  fingers: {
    thumb: FingerJointAngles;
    index: FingerJointAngles;
    middle: FingerJointAngles;
    ring: FingerJointAngles;
    pinky: FingerJointAngles;
  };
  spreadAnglesDeg: {
    thumbIndex: number;
    indexMiddle: number;
    middleRing: number;
    ringPinky: number;
  };
  normalizedTipDistances: {
    thumbToIndexTip: number;
    thumbToMiddleTip: number;
    thumbToPinkyMcp: number;
    thumbToIndexMcp: number;
    indexToMiddleTip: number;
  };
  averageFingerOpenness: number; // Mean extension across 4 fingers [0..1]
  handshapeVector: number[];     // Feature vector [thumb, index, middle, ring, pinky, pinchNorm, spreadNorm]
}

export interface BodyContextFeatures {
  detected: boolean;
  bodyScale: number;     // Shoulder width ||leftShoulder - rightShoulder||
  torsoHeight: number;   // Shoulder midpoint to hip midpoint
  shoulderMid: Point3D;
  hipMid: Point3D;
  nose: Point3D;
  chinEstimate: Point3D;
  leftEar: Point3D;
  rightEar: Point3D;
  mouthMid: Point3D;
  foreheadEstimate: Point3D;
  chestCenter: Point3D;
  leftShoulder: Point3D;
  rightShoulder: Point3D;
  leftElbow?: Point3D;
  rightElbow?: Point3D;
  trunkLeanDeg: number; // Lateral trunk tilt
  leftHandZone: BodyZone | null;
  rightHandZone: BodyZone | null;
  leftHandBodyRelative: Point3D | null;  // (handCenter - shoulderMid) / bodyScale
  rightHandBodyRelative: Point3D | null; // (handCenter - shoulderMid) / bodyScale
}

export interface FaceExpressionFeatures {
  detected: boolean;
  browRaiseScore: number;   // 0..1 (eyebrows lifted -> interrogative)
  browFurrowScore: number;  // 0..1 (eyebrows lowered/furrowed -> dúvida/WH)
  eyeOpenness: number;      // 0..1
  mouthOpenScore: number;   // 0..1
  smileScore: number;       // 0..1
  headYawDeg: number;       // Left/Right turn
  headPitchDeg: number;     // Up/Down nod
  headRollDeg: number;      // Tilt
  detectedNmf: NmfExpressionType;
}

export interface MultimodalFrameSnapshot {
  timestampMs: number;
  hands: HandGeometryFeatures[];
  body: BodyContextFeatures;
  face: FaceExpressionFeatures;
}

export interface HandKinematics {
  sampleCount: number;
  durationMs: number;
  trajectoryBodyNorm: Point3D[]; // Sequence of body-normalized positions
  opennessSeries: number[];      // Finger openness over time
  netDisplacement: Point3D;
  netDistance: number;           // Total Euclidean start-to-end distance (bodyScale units)
  totalPathLength: number;       // Sum of frame-to-frame steps
  meanSpeed: number;             // bodyScale / sec
  peakSpeed: number;
  accelerationPeak: number;
  lateralZeroCrossings: number;  // Direction reversals in X
  verticalZeroCrossings: number; // Direction reversals in Y
  circularSweepRad: number;      // Cumulative signed angle around trajectory centroid
  zApproachDelta: number;        // Negative = moved toward camera, positive = moved toward signer
  opennessDelta: number;         // End openness - start openness
  isMoving: boolean;
  isOscillatingLateral: boolean;
  isOscillatingVertical: boolean;
  isCircular: boolean;
  dominantMovement: MovementType;
}

export interface TemporalAnalysisSummary {
  frameCount: number;
  durationMs: number;
  primaryHandKinematics: HandKinematics | null;
  secondaryHandKinematics: HandKinematics | null;
  twoHandDistanceAvg: number | null;     // In palmScale units
  twoHandTipDistanceAvg: number | null;  // Index tips distance in palmScale units
  twoHandAlternatingScore: number;       // 0..1 alternating vertical/circular opposition
  headShakeCycles: number;               // Lateral head yaw reversals (negation NMF)
  headNodCycles: number;                 // Vertical head pitch reversals (affirmative NMF)
}

export interface NormalizedHandshapeProfile {
  // Ideal extension targets [0..1] and tolerances
  thumb: [number, number];  // [min, max]
  index: [number, number];
  middle: [number, number];
  ring: [number, number];
  pinky: [number, number];
  maxThumbIndexTipDist?: number; // For pinch / O shapes (in palmScale)
  minThumbIndexTipDist?: number;
  minIndexMiddleSpread?: number; // For V shape
  maxIndexMiddleSpread?: number; // For B / U shapes
}

export interface LibrasSignSpecification {
  id: string;
  name: string;
  gloss: string;
  portugueseTranslations: string[];
  category: string;
  icon: string;
  description: string;

  // Linguistic 5 Parameters
  handshapeName: string;
  palmOrientationLabel: string;
  articulationLocationLabel: string;
  initialPosition: string;
  finalPosition: string;
  trajectoryDescription: string;
  movementType: MovementType;
  facialExpressionLabel: string;
  expectedNmf: NmfExpressionType[];
  twoHanded: 1 | 2 | '1_or_2';
  referencePoints: BodyZone[];

  // Normalized Recognition Constraints & DTW Template
  handshapeProfile: NormalizedHandshapeProfile;
  allowedPalmFacings: PalmFacing[];
  requiresMotion: boolean;
  minConfidence: number; // 0..1 (e.g., 0.78)
  dtwTrajectoryTemplate?: Point3D[]; // Canonical normalized trajectory in bodyScale space

  // Validation & Verifiable Sources
  validationStatus: 'validated' | 'pending_validation';
  validationNotes: string;
  linguisticSource: {
    name: string;
    url: string;
    referenceId?: string;
    verified: boolean;
  };
  videoReference: {
    sourceName: string;
    externalUrl: string;
    directVideoUrl?: string; // Only populated when an authentic verified direct clip exists
    notes: string;
  };
}

export interface ConfidenceBreakdown {
  handshapeScore: number;    // 0..1
  orientationScore: number;  // 0..1
  locationScore: number;     // 0..1
  movementScore: number;     // 0..1
  consistencyScore: number;  // 0..1
  overallConfidence: number; // 0..1
}

export interface RecognitionEvaluation {
  status: 'recognized' | 'below_threshold' | 'no_hands' | 'insufficient_frames';
  sign: LibrasSignSpecification | null;
  confidence: number; // 0..100
  breakdown: ConfidenceBreakdown | null;
  topCandidate: {
    sign: LibrasSignSpecification;
    confidence: number;
    failureReason: string;
  } | null;
  message: string;
  nmfDetected: NmfExpressionType;
}

export interface HoldToConfirmState {
  candidateSignId: string | null;
  startedAtMs: number | null;
  elapsedMs: number;
  progressPercent: number; // 0..100
  confirmedSignId: string | null;
  lockedUntilNeutral: boolean; // Prevents registering the same held sign multiple times
  neutralFramesSinceConfirm: number;
}
