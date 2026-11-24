import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FlipHorizontal,
  Hand,
  MapPin,
  Activity,
  Smile
} from 'lucide-react';
import {
  DrawingUtils,
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult
} from '@mediapipe/tasks-vision';
import { CatalogSign } from '../data/librasCatalog255';
import { SignMediaPlayer } from './SignSchematicVisualizer';
import {
  evaluateSingleTargetSign,
  RecentHandSample,
  SingleTargetValidationResult
} from '../services/singleTargetValidator';
import { HandednessLabel } from '../types/librasRecognition';
import { soundService } from '../services/soundService';

const WASM_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

interface SingleTargetCameraExerciseProps {
  targetSign: CatalogSign;
  onPassed: (qualityPercent: number) => void;
  onSkipWithoutCamera?: () => void;
}

async function createTaskWithFallback<T>(
  factory: (delegate: 'GPU' | 'CPU') => Promise<T>
): Promise<T | null> {
  for (const delegate of ['GPU', 'CPU'] as const) {
    try {
      return await factory(delegate);
    } catch {
      // Fall back to CPU delegate
    }
  }
  return null;
}

function getCameraErrorText(err: unknown): string {
  const name =
    err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Permissão da câmera negada. Autorize a câmera no navegador e tente novamente.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Nenhuma câmera encontrada neste dispositivo.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'A câmera está sendo usada por outro aplicativo.';
  }
  return 'Não foi possível ativar a câmera neste ambiente.';
}

export const SingleTargetCameraExercise = ({
  targetSign,
  onPassed,
  onSkipWithoutCamera
}: SingleTargetCameraExerciseProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const drawingUtilsCacheRef = useRef<{ ctx: CanvasRenderingContext2D; utils: DrawingUtils } | null>(null);
  const lastHandTsRef = useRef<number>(0);
  const lastFaceTsRef = useRef<number>(0);
  const lastFaceInferMsRef = useRef<number>(0);
  const lastFaceResRef = useRef<FaceLandmarkerResult | undefined>(undefined);
  const isFrontCameraRef = useRef<boolean>(true);
  const recentSamplesRef = useRef<RecentHandSample[]>([]);
  const passTimerStartRef = useRef<number | null>(null);
  const hasPassedRef = useRef<boolean>(false);
  const onPassedRef = useRef(onPassed);
  onPassedRef.current = onPassed;

  const [cameraState, setCameraState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [modelsStatus, setModelsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [retryToken, setRetryToken] = useState(0);
  const [validation, setValidation] = useState<SingleTargetValidationResult>({
    qualityPercent: 0,
    handshapeScore: 0,
    locationScore: 0,
    stabilityScore: 0,
    nmfScore: 0,
    detectedHands: false,
    detectedFace: false,
    passed: false,
    tip: 'Posicione sua mão diante da câmera.'
  });
  const [confirmedQuality, setConfirmedQuality] = useState<number | null>(null);

  useEffect(() => {
    hasPassedRef.current = false;
    passTimerStartRef.current = null;
    recentSamplesRef.current = [];
    setConfirmedQuality(null);
  }, [targetSign.id]);

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
      lastFaceResRef.current = undefined;
      drawingUtilsCacheRef.current = null;
    };

    const startCameraAndModels = async () => {
      setCameraState('loading');
      setModelsStatus('loading');
      setErrorMessage(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('NotFoundError');
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false
          });
        } catch (primaryErr: unknown) {
          const errName =
            primaryErr && typeof primaryErr === 'object' && 'name' in primaryErr
              ? String((primaryErr as { name: string }).name)
              : '';
          if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          } else {
            throw primaryErr;
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const trackSettings = stream.getVideoTracks()[0]?.getSettings?.();
        isFrontCameraRef.current = trackSettings?.facingMode !== 'environment';

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (cancelled) return;
        // Show live video immediately while vision models download in parallel
        setCameraState('ready');

        let lastVideoTime = -1;
        let lastUiUpdateMs = 0;

        const processFrame = () => {
          if (cancelled) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (
            video &&
            canvas &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0 &&
            video.currentTime !== lastVideoTime
          ) {
            lastVideoTime = video.currentTime;
            const rawNow = performance.now();

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const ctx = canvas.getContext('2d');
            let handRes: HandLandmarkerResult | undefined;

            if (handLandmarkerRef.current) {
              try {
                const handTs = Math.max(Math.round(rawNow), lastHandTsRef.current + 1);
                lastHandTsRef.current = handTs;
                handRes = handLandmarkerRef.current.detectForVideo(video, handTs);
              } catch {
                // Skip transient hand inference hiccups safely
              }
            }

            if (faceLandmarkerRef.current && rawNow - lastFaceInferMsRef.current >= 150) {
              lastFaceInferMsRef.current = rawNow;
              try {
                const faceTs = Math.max(Math.round(rawNow), lastFaceTsRef.current + 1);
                lastFaceTsRef.current = faceTs;
                lastFaceResRef.current = faceLandmarkerRef.current.detectForVideo(video, faceTs);
              } catch {
                // Keep previous cached face landmarks if one frame fails
              }
            }

            const faceRes = lastFaceResRef.current;

            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              if (!drawingUtilsCacheRef.current || drawingUtilsCacheRef.current.ctx !== ctx) {
                drawingUtilsCacheRef.current = { ctx, utils: new DrawingUtils(ctx) };
              }
              const drawingUtils = drawingUtilsCacheRef.current.utils;

              if (faceRes?.faceLandmarks?.[0]) {
                const chin = faceRes.faceLandmarks[0][152];
                const forehead = faceRes.faceLandmarks[0][10];
                if (chin && forehead) {
                  ctx.fillStyle = 'rgba(13, 148, 136, 0.75)';
                  ctx.beginPath();
                  ctx.arc(chin.x * canvas.width, chin.y * canvas.height, 4, 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              if (handRes?.landmarks) {
                for (const landmarks of handRes.landmarks) {
                  drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: '#0D9488',
                    lineWidth: 2.5
                  });
                  drawingUtils.drawLandmarks(landmarks, {
                    color: '#EA580C',
                    lineWidth: 1,
                    radius: 3
                  });
                }
              }
            }

            if (handLandmarkerRef.current) {
              const primaryLm = handRes?.landmarks?.[0];
              if (primaryLm && primaryLm[9] && primaryLm[0]) {
                const cx = (primaryLm[0].x + primaryLm[9].x) / 2;
                const cy = (primaryLm[0].y + primaryLm[9].y) / 2;
                const cz = ((primaryLm[0].z ?? 0) + (primaryLm[9].z ?? 0)) / 2;
                recentSamplesRef.current.push({ x: cx, y: cy, z: cz, t: rawNow });
                recentSamplesRef.current = recentSamplesRef.current.filter(
                  (s) => rawNow - s.t <= 900
                );
              } else {
                recentSamplesRef.current = [];
              }

              const handednesses: HandednessLabel[] = (handRes?.handedness || []).map((cats) => {
                const rawLabel = cats?.[0]?.categoryName;
                if (isFrontCameraRef.current) {
                  if (rawLabel === 'Left') return 'Right';
                  if (rawLabel === 'Right') return 'Left';
                  return 'Unknown';
                }
                return rawLabel === 'Left' || rawLabel === 'Right' ? rawLabel : 'Unknown';
              });

              const evalRes = evaluateSingleTargetSign({
                target: targetSign.targetLandmarks,
                handLandmarks: handRes?.landmarks || [],
                worldLandmarks: handRes?.worldLandmarks,
                handednesses,
                faceLandmarks: faceRes?.faceLandmarks?.[0],
                faceBlendshapes: faceRes?.faceBlendshapes,
                recentCenters: recentSamplesRef.current
              });

              if (rawNow - lastUiUpdateMs >= 80) {
                lastUiUpdateMs = rawNow;
                setValidation(evalRes);
              }

              if (!hasPassedRef.current) {
                if (evalRes.passed) {
                  if (passTimerStartRef.current === null) {
                    passTimerStartRef.current = rawNow;
                  } else if (rawNow - passTimerStartRef.current >= 320) {
                    hasPassedRef.current = true;
                    soundService.playCorrect();
                    setConfirmedQuality(evalRes.qualityPercent);
                    onPassedRef.current(evalRes.qualityPercent);
                  }
                } else {
                  passTimerStartRef.current = null;
                }
              }
            }
          }

          if (!hasPassedRef.current) {
            rafRef.current = requestAnimationFrame(processFrame);
          }
        };

        rafRef.current = requestAnimationFrame(processFrame);

        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
        } catch {
          vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);
        }
        if (cancelled) return;

        // Load HandLandmarker first to unlock sign detection fast; FaceLandmarker attaches seamlessly
        const handPromise = createTaskWithFallback((delegate) =>
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
            runningMode: 'VIDEO',
            numHands: targetSign.targetLandmarks.twoHanded === 2 ? 2 : 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          })
        ).then((handLm) => {
          if (cancelled) {
            handLm?.close();
            return null;
          }
          if (!handLm) {
            setModelsStatus('error');
            return null;
          }
          handLandmarkerRef.current = handLm;
          setModelsStatus('ready');
          return handLm;
        });

        const facePromise = createTaskWithFallback((delegate) =>
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          })
        ).then((faceLm) => {
          if (cancelled) {
            faceLm?.close();
            return null;
          }
          if (faceLm) {
            faceLandmarkerRef.current = faceLm;
          }
          return faceLm;
        });

        await Promise.all([handPromise, facePromise]);
      } catch (err) {
        if (!cancelled) {
          setCameraState('error');
          setErrorMessage(getCameraErrorText(err));
        }
      }
    };

    startCameraAndModels();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [targetSign, retryToken]);

  const qualityColor =
    validation.qualityPercent >= 80
      ? 'bg-[#0D9488]'
      : validation.qualityPercent >= 55
      ? 'bg-[#EA580C]'
      : 'bg-[#D97706]';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Left: Target Sign Reference */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                Sinal alvo
              </span>
              <span className="text-[11px] font-bold text-[#57534E]">{targetSign.categoria}</span>
            </div>
            <h3 className="font-display text-xl font-bold text-[#1C1917]">{targetSign.palavra}</h3>
            <p className="text-xs font-medium text-[#57534E]">{targetSign.significado}</p>
          </div>

          <SignMediaPlayer sign={targetSign} compact={true} />
        </div>

        {/* Right: Webcam & Real-Time Single-Target Quality */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EA580C] flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>Sua execução ao vivo</span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundService.playTap();
                setIsMirrored((m) => !m);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#57534E] font-bold text-[11px] cursor-pointer"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Espelhar</span>
            </button>
          </div>

          {/* Video + Landmarks Viewport */}
          <div className="relative aspect-video bg-stone-950 rounded-2xl overflow-hidden border border-[#E8E2D9] flex items-center justify-center">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''} ${
                cameraState === 'ready' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                isMirrored ? '-scale-x-100' : ''
              }`}
            />

            {cameraState === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold p-4 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
                <span>Iniciando câmera...</span>
              </div>
            )}

            {cameraState === 'ready' && modelsStatus === 'loading' && confirmedQuality === null && (
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0D9488]" />
                <span>Ativando detecção de mão...</span>
              </div>
            )}

            {cameraState === 'ready' && modelsStatus === 'error' && (
              <div className="absolute top-2.5 left-2.5 right-2.5 px-3 py-2 rounded-xl bg-rose-950/90 border border-rose-500/50 text-white text-[11px] font-semibold flex items-center justify-between gap-2">
                <span>Não foi possível inicializar o detector de mãos.</span>
                <button
                  type="button"
                  onClick={() => setRetryToken((t) => t + 1)}
                  className="px-2.5 py-1 rounded-lg bg-[#EA580C] text-white font-bold shrink-0 cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {cameraState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#FAF9F6] text-[#1C1917] p-4 text-center">
                <AlertTriangle className="w-7 h-7 text-[#EA580C]" />
                <p className="text-xs font-semibold text-[#57534E] max-w-xs">{errorMessage}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRetryToken((t) => t + 1)}
                    className="tactile-btn px-3.5 py-2 rounded-xl bg-[#EA580C] text-white font-bold text-xs border-b-[3px] border-[#9A3412] cursor-pointer"
                  >
                    Tentar câmera novamente
                  </button>
                  {onSkipWithoutCamera && (
                    <button
                      type="button"
                      onClick={onSkipWithoutCamera}
                      className="px-3.5 py-2 rounded-xl bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#1C1917] font-bold text-xs cursor-pointer"
                    >
                      Não posso usar a câmera agora
                    </button>
                  )}
                </div>
              </div>
            )}

            {confirmedQuality !== null && (
              <div className="absolute top-3 left-3 right-3 px-3 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sinal aprovado ({confirmedQuality}% de qualidade)</span>
              </div>
            )}
          </div>

          {/* Real-Time Quality Bar (0% - 100%) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1C1917]">Qualidade do sinal</span>
              <span
                className={
                  validation.qualityPercent >= 80 ? 'text-[#0F766E]' : 'text-[#EA580C]'
                }
              >
                {confirmedQuality ?? validation.qualityPercent}% · Meta 80%
              </span>
            </div>

            <div className="w-full h-3.5 bg-[#F3F0EA] rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-150 ${qualityColor}`}
                style={{ width: `${confirmedQuality ?? validation.qualityPercent}%` }}
              />
              {/* 80% threshold marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#1C1917]/30"
                style={{ left: '80%' }}
                title="Meta mínima: 80%"
              />
            </div>

            {/* 4 Breakdown Indicators (CM, PA, Movimento/Orientação, ENM) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-[#57534E] tabular-nums">
              <div className="flex items-center gap-1 bg-[#FAF9F6] px-2 py-1.5 rounded-lg border border-[#E8E2D9] min-w-0">
                <Hand className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                <span className="truncate">Mão {validation.handshapeScore}%</span>
              </div>
              <div className="flex items-center gap-1 bg-[#FAF9F6] px-2 py-1.5 rounded-lg border border-[#E8E2D9] min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                <span className="truncate">Local {validation.locationScore}%</span>
              </div>
              <div className="flex items-center gap-1 bg-[#FAF9F6] px-2 py-1.5 rounded-lg border border-[#E8E2D9] min-w-0">
                <Activity className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span className="truncate">Mov. {validation.stabilityScore}%</span>
              </div>
              <div className="flex items-center gap-1 bg-[#FAF9F6] px-2 py-1.5 rounded-lg border border-[#E8E2D9] min-w-0">
                <Smile className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                <span className="truncate">ENM {validation.nmfScore}%</span>
              </div>
            </div>

            {/* Short Live Tip */}
            <div
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                confirmedQuality !== null || validation.passed
                  ? 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]'
                  : 'bg-[#FFF1E6] text-[#9A3412] border-[#FED7AA]'
              }`}
            >
              {confirmedQuality !== null
                ? 'Muito bem! Sinal validado. Toque em continuar abaixo.'
                : validation.tip}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
