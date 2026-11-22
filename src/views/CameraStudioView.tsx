import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  ArrowLeft,
  Volume2,
  Copy,
  Trash2,
  Sparkles,
  Check,
  FlipHorizontal,
  RefreshCw,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Info,
  Delete,
  SlidersHorizontal,
  AlertTriangle,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  FilesetResolver,
  HolisticLandmarker,
  HandLandmarker,
  PoseLandmarker,
  FaceLandmarker,
  DrawingUtils
} from '@mediapipe/tasks-vision';
import { UserProfile } from '../types';
import {
  HandednessLabel,
  HandGeometryFeatures,
  HoldToConfirmState,
  NmfExpressionType,
  RecognitionEvaluation
} from '../types/librasRecognition';
import { LIBRAS_SIGN_DATABASE } from '../data/librasSignDatabase';
import {
  extractBodyContext,
  extractFaceExpressions,
  extractHandGeometry
} from '../services/multimodalGeometry';
import { TemporalMotionBuffer } from '../services/temporalAnalyzer';
import {
  createInitialHoldState,
  stepHoldToConfirm
} from '../services/holdToConfirm';
import {
  RecognizedSign,
  buildTranslationOutput,
  evaluateMultimodalLibrasSign,
  speakPortugueseText,
  toRecognizedSign
} from '../services/librasTranslatorService';
import { soundService } from '../services/soundService';

interface CameraStudioViewProps {
  userProfile?: UserProfile;
  onClose?: () => void;
  onEarnReward?: (xp: number, gems: number) => void;
}

const NMF_LABELS: Record<NmfExpressionType, string> = {
  neutral: 'Expressão Neutra',
  interrogative_brows_up: 'Interrogativa (Sobrancelhas Erguidas)',
  wh_brows_furrowed: 'Dúvida / WH (Sobrancelhas Franzidas)',
  negative_head_shake: 'Negação (Cabeça)',
  affirmative_nod: 'Afirmação (Cabeça)',
  positive_smile: 'Expressão Positiva',
  any: 'Neutra'
};

export const CameraStudioView: React.FC<CameraStudioViewProps> = ({
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // MediaPipe Vision Tasks (Holistic primary, Hand+Pose+Face fallback)
  const holisticLandmarkerRef = useRef<HolisticLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const usingHolisticRef = useRef<boolean>(false);
  const requestAnimationRef = useRef<number | null>(null);

  // Temporal & Hold-to-Confirm state machines
  const temporalBufferRef = useRef<TemporalMotionBuffer>(new TemporalMotionBuffer(36, 1500));
  const holdStateRef = useRef<HoldToConfirmState>(createInitialHoldState());

  // Camera states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [trackingEngineMode, setTrackingEngineMode] = useState<'holistic' | 'multimodal' | 'loading'>('loading');

  // Recognition & Calibration states
  const [isTranslating, setIsTranslating] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(76);
  const [holdDurationMs, setHoldDurationMs] = useState<number>(650);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);

  const [evaluation, setEvaluation] = useState<RecognitionEvaluation>({
    status: 'no_hands',
    sign: null,
    confidence: 0,
    breakdown: null,
    topCandidate: null,
    message: 'Posicione suas mãos diante da câmera.',
    nmfDetected: 'neutral'
  });
  const [holdProgress, setHoldProgress] = useState<number>(0);

  // Phrase & Correction States
  const [signSequence, setSignSequence] = useState<RecognizedSign[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSignsGuide, setShowSignsGuide] = useState<boolean>(false);

  // Refs synced for animation loop
  const confidenceThresholdRef = useRef(confidenceThreshold);
  confidenceThresholdRef.current = confidenceThreshold;
  const holdDurationMsRef = useRef(holdDurationMs);
  holdDurationMsRef.current = holdDurationMs;
  const isMirroredRef = useRef(isMirrored);
  isMirroredRef.current = isMirrored;

  // Initialize MediaPipe Multimodal Vision (Holistic primary, Hand+Pose+Face fallback)
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipeVision() {
      try {
        setIsModelLoading(true);
        setTrackingEngineMode('loading');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );

        if (!isMounted) return;

        // 1. Try MediaPipe HolisticLandmarker (Hands + Pose + Face simultaneously)
        let holisticReady = false;
        for (const delegate of ['GPU', 'CPU'] as const) {
          try {
            holisticLandmarkerRef.current = await HolisticLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath:
                  'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task',
                delegate
              },
              runningMode: 'VIDEO',
              minFaceDetectionConfidence: 0.5,
              minFacePresenceConfidence: 0.5,
              minPoseDetectionConfidence: 0.5,
              minPosePresenceConfidence: 0.5,
              minHandLandmarksConfidence: 0.5,
              outputFaceBlendshapes: true
            });
            usingHolisticRef.current = true;
            holisticReady = true;
            break;
          } catch (err) {
            console.warn(`HolisticLandmarker (${delegate}) fallback check:`, err);
          }
        }

        if (!isMounted) return;

        if (holisticReady) {
          setTrackingEngineMode('holistic');
          setIsModelLoading(false);
          return;
        }

        // 2. Fallback: Multimodal HandLandmarker + PoseLandmarker + FaceLandmarker
        usingHolisticRef.current = false;

        try {
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.55,
            minHandPresenceConfidence: 0.55,
            minTrackingConfidence: 0.55
          });
        } catch {
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.55,
            minHandPresenceConfidence: 0.55,
            minTrackingConfidence: 0.55
          });
        }

        try {
          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        } catch {
          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        }

        try {
          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        } catch {
          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        }

        if (isMounted) {
          setTrackingEngineMode('multimodal');
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error('Error initializing MediaPipe multimodal vision:', err);
        if (isMounted) {
          setIsModelLoading(false);
        }
      }
    }

    initMediaPipeVision();

    return () => {
      isMounted = false;
      holisticLandmarkerRef.current?.close();
      holisticLandmarkerRef.current = null;
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
      poseLandmarkerRef.current?.close();
      poseLandmarkerRef.current = null;
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.log('Auto-play error:', e));
        };
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permissão de câmera não concedida. Por favor, permita o acesso à câmera no seu navegador.'
          : 'Não foi possível iniciar a câmera. Verifique se o dispositivo possui webcam disponível.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    temporalBufferRef.current.clear();
    holdStateRef.current = createInitialHoldState();
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const handleAddSign = useCallback((sign: RecognizedSign) => {
    setSignSequence((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].id === sign.id) {
        return prev;
      }
      return [...prev, sign];
    });
  }, []);

  // Real-time Multimodal Recognition Loop
  useEffect(() => {
    let lastVideoTime = -1;

    const predictLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const nowMs = performance.now();
            const drawingUtils = new DrawingUtils(ctx);

            const extractedHands: HandGeometryFeatures[] = [];
            let poseLandmarks: { x: number; y: number; z?: number }[] | undefined;
            let faceLandmarks: { x: number; y: number; z?: number }[] | undefined;
            let faceBlendshapes: any[] | undefined;

            // A) Holistic pipeline
            if (usingHolisticRef.current && holisticLandmarkerRef.current) {
              try {
                const hRes = holisticLandmarkerRef.current.detectForVideo(video, nowMs);
                if (hRes.poseLandmarks?.length) {
                  poseLandmarks = hRes.poseLandmarks[0];
                }
                if (hRes.faceLandmarks?.length) {
                  faceLandmarks = hRes.faceLandmarks[0];
                }
                if (hRes.faceBlendshapes?.length) {
                  faceBlendshapes = hRes.faceBlendshapes;
                }
                if (hRes.leftHandLandmarks?.length) {
                  const lms = hRes.leftHandLandmarks[0];
                  const world = hRes.leftHandWorldLandmarks?.[0];
                  extractedHands.push(extractHandGeometry(lms, 'Left', world));
                }
                if (hRes.rightHandLandmarks?.length) {
                  const lms = hRes.rightHandLandmarks[0];
                  const world = hRes.rightHandWorldLandmarks?.[0];
                  extractedHands.push(extractHandGeometry(lms, 'Right', world));
                }
              } catch {
                // ignore occasional video timestamp race
              }
            } else {
              // B) Separate Hand + Pose + Face Landmarkers pipeline
              if (poseLandmarkerRef.current) {
                try {
                  const poseRes = poseLandmarkerRef.current.detectForVideo(video, nowMs);
                  if (poseRes.landmarks?.length) {
                    poseLandmarks = poseRes.landmarks[0];
                  }
                } catch {
                  // ignore
                }
              }

              if (faceLandmarkerRef.current) {
                try {
                  const faceRes = faceLandmarkerRef.current.detectForVideo(video, nowMs);
                  if (faceRes.faceLandmarks?.length) {
                    faceLandmarks = faceRes.faceLandmarks[0];
                  }
                  if (faceRes.faceBlendshapes?.length) {
                    faceBlendshapes = faceRes.faceBlendshapes;
                  }
                } catch {
                  // ignore
                }
              }

              if (handLandmarkerRef.current) {
                try {
                  const handRes = handLandmarkerRef.current.detectForVideo(video, nowMs);
                  if (handRes.landmarks?.length) {
                    for (let i = 0; i < handRes.landmarks.length; i++) {
                      const rawCat = handRes.handedness?.[i]?.[0]?.categoryName;
                      // In unmirrored video input, HandLandmarker labels reflect mirrored selfie convention
                      let label: HandednessLabel = 'Unknown';
                      if (rawCat === 'Left') label = isMirroredRef.current ? 'Right' : 'Left';
                      if (rawCat === 'Right') label = isMirroredRef.current ? 'Left' : 'Right';

                      extractedHands.push(
                        extractHandGeometry(handRes.landmarks[i], label, handRes.worldLandmarks?.[i])
                      );
                    }
                  }
                } catch {
                  // ignore
                }
              }
            }

            // Draw clean hand landmarks (and subtle shoulder reference dots)
            for (const hand of extractedHands) {
              const drawableLandmarks = hand.landmarks.map((p) => ({
                x: p.x,
                y: p.y,
                z: p.z,
                visibility: 1
              }));
              drawingUtils.drawConnectors(drawableLandmarks, HandLandmarker.HAND_CONNECTIONS, {
                color: 'rgba(255, 107, 0, 0.72)',
                lineWidth: 2.2
              });
              drawingUtils.drawLandmarks(drawableLandmarks, {
                color: '#FFFFFF',
                fillColor: '#FF6B00',
                lineWidth: 1.5,
                radius: 3
              });
            }

            if (poseLandmarks && poseLandmarks.length > 12) {
              // Subtle shoulder anchor points only (clean camera)
              const anchors = [poseLandmarks[11], poseLandmarks[12]]
                .filter(Boolean)
                .map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0, visibility: 1 }));
              drawingUtils.drawLandmarks(anchors, {
                color: 'rgba(255,255,255,0.45)',
                fillColor: 'rgba(56, 189, 248, 0.65)',
                radius: 4
              });
            }

            // Multimodal Feature Extraction & Temporal Buffer Update
            if (isTranslating) {
              if (extractedHands.length > 0) {
                const bodyCtx = extractBodyContext(poseLandmarks, extractedHands);
                const faceCtx = extractFaceExpressions(faceLandmarks, faceBlendshapes);

                temporalBufferRef.current.push({
                  timestampMs: nowMs,
                  hands: extractedHands,
                  body: bodyCtx,
                  face: faceCtx
                });

                const evalResult = evaluateMultimodalLibrasSign(temporalBufferRef.current, {
                  confidenceThreshold: confidenceThresholdRef.current,
                  minFramesRequired: 4
                });

                const holdStep = stepHoldToConfirm(holdStateRef.current, evalResult, nowMs, {
                  holdDurationMs: holdDurationMsRef.current,
                  releaseNeutralFramesRequired: 4
                });
                holdStateRef.current = holdStep.nextState;

                setEvaluation(evalResult);
                setHoldProgress(holdStep.nextState.progressPercent);

                if (holdStep.newlyConfirmedSign) {
                  soundService.playCorrect();
                  handleAddSign(toRecognizedSign(holdStep.newlyConfirmedSign));
                }
              } else {
                // Tracking lost -> clear temporal sequence & reset Hold-to-Confirm immediately
                temporalBufferRef.current.clear();
                const noHandsEval: RecognitionEvaluation = {
                  status: 'no_hands',
                  sign: null,
                  confidence: 0,
                  breakdown: null,
                  topCandidate: null,
                  message: 'Posicione suas mãos diante da câmera.',
                  nmfDetected: 'neutral'
                };
                const resetStep = stepHoldToConfirm(holdStateRef.current, noHandsEval, nowMs);
                holdStateRef.current = resetStep.nextState;
                setEvaluation(noHandsEval);
                setHoldProgress(0);
              }
            }
          }
        }
      }

      requestAnimationRef.current = requestAnimationFrame(predictLoop);
    };

    if (cameraActive) {
      requestAnimationRef.current = requestAnimationFrame(predictLoop);
    }

    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }
    };
  }, [cameraActive, isTranslating, handleAddSign]);

  // Phrase output synthesis (explicitly separating isolated signs from contextual suggestions)
  const translationOutput = buildTranslationOutput(
    signSequence.map((s) => s.gloss),
    evaluation.nmfDetected
  );

  const activeSpeechText =
    translationOutput.contextualSuggestion ?? translationOutput.literalPortuguese;

  // Phrase & Manual Correction Actions
  const handleClear = () => {
    soundService.playTap();
    setSignSequence([]);
    setEditingIndex(null);
  };

  const handleUndoLast = () => {
    soundService.playPop();
    setSignSequence((prev) => prev.slice(0, -1));
    setEditingIndex(null);
  };

  const handleRemoveAtIndex = (index: number) => {
    soundService.playPop();
    setSignSequence((prev) => prev.filter((_, idx) => idx !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleSpeak = () => {
    soundService.playTap();
    if (signSequence.length === 0) return;
    speakPortugueseText(activeSpeechText);
  };

  const handleCopy = () => {
    soundService.playTap();
    if (signSequence.length === 0) return;
    navigator.clipboard.writeText(activeSpeechText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleManualPickSign = (sign: RecognizedSign) => {
    soundService.playTap();
    if (editingIndex !== null) {
      setSignSequence((prev) =>
        prev.map((item, idx) => (idx === editingIndex ? sign : item))
      );
      setEditingIndex(null);
    } else {
      handleAddSign(sign);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0A09] text-white flex flex-col items-center justify-between select-none overflow-hidden font-sans">
      {/* 1. Clean Top Header */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
        {onClose ? (
          <button
            onClick={() => {
              soundService.playTap();
              stopCamera();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 font-black text-xs uppercase tracking-wider backdrop-blur-md cursor-pointer transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Voltar</span>
          </button>
        ) : (
          <div />
        )}

        {/* Engine Status Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 text-xs font-bold">
          <span
            className={`w-2 h-2 rounded-full ${
              isModelLoading
                ? 'bg-amber-400 animate-pulse'
                : cameraActive && isTranslating
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-stone-500'
            }`}
          />
          <span className="text-stone-200">
            {isModelLoading
              ? 'Carregando Holistic...'
              : trackingEngineMode === 'holistic'
              ? 'Holistic (Mãos+Corpo+Face)'
              : 'Multimodal (Mãos+Corpo+Face)'}
          </span>
        </div>

        {/* Camera & Threshold Calibration Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundService.playTap();
              setShowCalibration((prev) => !prev);
            }}
            title="Calibrar Confiança & Hold"
            className={`p-2.5 rounded-2xl border backdrop-blur-md cursor-pointer transition-all active:scale-95 ${
              showCalibration
                ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundService.playTap();
              setIsMirrored((prev) => !prev);
            }}
            title="Espelhar Câmera"
            className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md cursor-pointer transition-all active:scale-95"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundService.playTap();
              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
            }}
            title="Trocar Câmera"
            className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Optional Compact Calibration Drawer */}
      {showCalibration && (
        <div className="absolute top-20 right-4 z-40 w-72 bg-[#1C1917]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-black uppercase tracking-wider text-[#FF6B00]">
              Calibração do Reconhecimento
            </span>
            <button
              onClick={() => setShowCalibration(false)}
              className="text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-bold">
              <span>Limite mínimo de confiança</span>
              <span className="text-[#FF6B00]">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={90}
              step={1}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full accent-[#FF6B00]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-bold">
              <span>Tempo Hold-to-Confirm</span>
              <span className="text-[#FF6B00]">{holdDurationMs} ms</span>
            </div>
            <input
              type="range"
              min={350}
              max={1200}
              step={50}
              value={holdDurationMs}
              onChange={(e) => setHoldDurationMs(Number(e.target.value))}
              className="w-full accent-[#FF6B00]"
            />
          </div>
        </div>
      )}

      {/* 2. Full-Screen Video & Multimodal Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* Recognized Sign Preview + Circular Hold-to-Confirm Ring */}
        {isTranslating && evaluation.status === 'recognized' && evaluation.sign && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-3 rounded-3xl bg-black/85 border-2 border-[#FF6B00] backdrop-blur-xl shadow-2xl animate-fade-in pointer-events-none max-w-[92vw]">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" className="stroke-white/20 fill-none" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  className="stroke-[#FF6B00] fill-none transition-all duration-75 ease-out"
                  strokeWidth="3"
                  strokeDasharray="94.2"
                  strokeDashoffset={94.2 - (94.2 * holdProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg">{evaluation.sign.icon}</span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#FF6B00]">
                  {holdProgress >= 100 ? 'Sinal Registrado!' : 'Segure para confirmar...'}
                </span>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                  {evaluation.confidence}% conf.
                </span>
              </div>
              <span className="text-sm font-black text-white truncate">
                {evaluation.sign.name}
              </span>
              {evaluation.nmfDetected !== 'neutral' && (
                <span className="text-[10px] text-amber-300 font-semibold">
                  NMF: {NMF_LABELS[evaluation.nmfDetected]}
                </span>
              )}
            </div>

            <div className="ml-1 w-11 text-right shrink-0">
              <span className="text-xs font-black text-[#FF6B00]">{holdProgress}%</span>
            </div>
          </div>
        )}

        {/* Below-Threshold Warning Pill (Never invents translation!) */}
        {isTranslating && evaluation.status === 'below_threshold' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-black/85 border border-amber-500/60 backdrop-blur-xl shadow-xl pointer-events-none max-w-[92vw]">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-amber-300">
                Sinal não reconhecido ({evaluation.confidence}% &lt; {confidenceThreshold}%)
              </span>
              <span className="text-[11px] text-stone-300 truncate">
                {evaluation.topCandidate?.failureReason || 'Repita o sinal diante da câmera.'}
              </span>
            </div>
          </div>
        )}

        {/* Inactive Camera / Permission Overlay */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90 space-y-4 z-20">
            <div className="w-20 h-20 rounded-3xl bg-[#FF6B00]/20 border-2 border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] animate-pulse">
              <Camera className="w-10 h-10" />
            </div>

            <div className="space-y-1 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Reconhecimento Multimodal de Libras
              </h2>
              <p className="text-sm text-stone-300">
                {cameraError ||
                  'Ative a câmera para detectar sinais isolados com análise de mãos, corpo, expressão facial e movimento temporal.'}
              </p>
            </div>

            <button
              onClick={startCamera}
              className="px-6 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-sm uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-xl transition-all active:translate-y-0.5"
            >
              Ligar Câmera e Iniciar
            </button>
          </div>
        )}
      </div>

      {/* 3. DEDICATED TRANSLATION & CORRECTION CONSOLE */}
      <footer className="w-full z-40 bg-[#141210]/95 backdrop-blur-2xl border-t-2 border-white/10 px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col gap-2.5 shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              Sinais Reconhecidos → Português
            </h3>
            <span className="text-[10px] font-bold bg-white/10 text-stone-300 px-2 py-0.5 rounded-full">
              Sinais Isolados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundService.playTap();
                setIsTranslating((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 font-bold text-xs cursor-pointer transition-all active:scale-95"
            >
              {isTranslating ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">{isTranslating ? 'Pausar' : 'Continuar'}</span>
            </button>

            <button
              onClick={() => {
                soundService.playTap();
                setShowSignsGuide((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 font-bold text-xs cursor-pointer transition-all active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="hidden sm:inline">Sinais / Correção</span>
              {showSignsGuide ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Interactive Sequence Chips (click to replace manually, X to remove) */}
        {signSequence.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            <span className="text-[11px] font-bold text-stone-400 shrink-0">Glosas:</span>
            {signSequence.map((s, idx) => {
              const isEditing = editingIndex === idx;
              return (
                <div
                  key={`${s.id}-${idx}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black shrink-0 transition-all ${
                    isEditing
                      ? 'bg-[#FF6B00] border-white text-white'
                      : 'bg-black/50 border-[#FF6B00]/40 text-[#FFEDD5]'
                  }`}
                >
                  <button
                    onClick={() => {
                      soundService.playTap();
                      setEditingIndex(isEditing ? null : idx);
                      setShowSignsGuide(true);
                    }}
                    title="Clique para corrigir este sinal manualmente"
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <span>{s.icon}</span>
                    <span>{s.gloss}</span>
                  </button>
                  <button
                    onClick={() => handleRemoveAtIndex(idx)}
                    title="Remover sinal"
                    className="text-stone-400 hover:text-rose-400 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Output Box: Literal vs Contextual Suggestion */}
        <div className="bg-black/60 rounded-2xl border border-white/15 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                {translationOutput.contextualSuggestion
                  ? 'Sugestão Contextual em Português:'
                  : 'Mapeamento Literal dos Sinais:'}
              </span>
              {translationOutput.contextualSuggestion && (
                <span className="text-[10px] text-amber-300 font-bold">
                  (Literal: {translationOutput.literalPortuguese})
                </span>
              )}
            </div>

            <p
              className={`text-base sm:text-lg font-black leading-snug break-words ${
                signSequence.length > 0 ? 'text-white' : 'text-stone-400 italic font-medium'
              }`}
            >
              "{activeSpeechText}"
            </p>

            <p className="text-[10px] text-stone-400 leading-tight">
              {translationOutput.methodologyNotice}
            </p>
          </div>

          {/* Action buttons: Speak, Copy, Undo Last, Clear */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              onClick={handleSpeak}
              disabled={signSequence.length === 0}
              title="Ouvir em voz alta"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Ouvir</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={signSequence.length === 0}
              title="Copiar texto"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleUndoLast}
              disabled={signSequence.length === 0}
              title="Apagar último sinal"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 border border-white/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Delete className="w-4 h-4" />
            </button>

            <button
              onClick={handleClear}
              disabled={signSequence.length === 0}
              title="Limpar frase"
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-950/40 text-stone-300 hover:text-rose-400 border border-white/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Sign Bank Reference & Manual Correction Grid */}
        {showSignsGuide && (
          <div className="bg-black/85 rounded-2xl border border-white/15 p-3.5 space-y-2.5 max-h-52 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase text-stone-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {editingIndex !== null
                    ? `Selecione o sinal correto para substituir #${editingIndex + 1}:`
                    : 'Banco de Sinais (Clique para inserir/corrigir):'}
                </span>
              </span>
              <span className="text-[10px] text-stone-400">
                Fontes: SignBank UFSC / Spread the Sign / INES
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {LIBRAS_SIGN_DATABASE.map((spec) => {
                const isValidated = spec.validationStatus === 'validated';
                return (
                  <button
                    key={spec.id}
                    onClick={() => handleManualPickSign(toRecognizedSign(spec))}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-[#FF6B00]/20 hover:border-[#FF6B00]/50 border border-white/10 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {spec.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white truncate">{spec.name}</div>
                      <div className="flex items-center gap-1 text-[9px] font-bold">
                        <span
                          className={
                            isValidated ? 'text-emerald-400' : 'text-amber-400'
                          }
                        >
                          {isValidated ? 'Validado' : 'Pendente validação'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
