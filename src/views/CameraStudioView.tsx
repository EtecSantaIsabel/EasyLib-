import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  ArrowLeft, 
  FlipHorizontal,
  Hand,
  Smile,
  Sparkles,
  Loader2,
  HelpCircle,
  CheckCircle2,
  Eye,
  Info,
  User,
  Layers,
  Activity
} from 'lucide-react';
import { 
  FilesetResolver, 
  HandLandmarker, 
  FaceLandmarker, 
  PoseLandmarker,
  DrawingUtils 
} from '@mediapipe/tasks-vision';
import { UserProfile } from '../types';
import { soundService } from '../services/soundService';
import { LibiMascot } from '../components/LibiMascot';

interface CameraStudioViewProps {
  userProfile?: UserProfile;
  onClose?: () => void;
  onEarnReward?: (xp: number, gems: number) => void;
}

export type FacialExpressionState = 
  | 'neutro'
  | 'pergunta_geral'   // Sobrancelhas levantadas (Sim/Não)
  | 'duvida_especifica' // Sobrancelhas franzidas (Quem? Onde? Por quê?)
  | 'afirmativo_sorriso' // Sorriso amigável
  | 'enfase_espanto';   // Boca aberta / Olhos arregalados

export type SignHeightZone = 
  | 'topo_cabeca_testa' // Testa / Alto da Cabeça (Saber, Aprender, Pensar)
  | 'olhos_tempora'     // Olhos / Têmpora (Ver, Olhar, Dia)
  | 'boca_queixo'       // Boca / Queixo (Comer, Falar, Desculpa, Bom)
  | 'peito_tronco'      // Peito / Ombros (Gostar, Amar, Meu Nome, Saudade)
  | 'espaco_neutro'     // Espaço Neutro / Abdômen (Casa, Trabalhar, Ajudar, Carro)
  | 'abaixo_cintura'    // Abaixo da Cintura
  | 'indefinido';

export const CameraStudioView: React.FC<CameraStudioViewProps> = ({
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // MediaPipe Vision Tasks
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestAnimationRef = useRef<number | null>(null);

  // Camera states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Tracking toggles & states
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [showHandSkeleton, setShowHandSkeleton] = useState<boolean>(true);
  const [showFaceMesh, setShowFaceMesh] = useState<boolean>(true);
  const [showPoseSkeleton, setShowPoseSkeleton] = useState<boolean>(true);

  const [handsDetectedCount, setHandsDetectedCount] = useState<number>(0);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [poseDetected, setPoseDetected] = useState<boolean>(false);

  const [currentExpression, setCurrentExpression] = useState<FacialExpressionState>('neutro');
  const [expressionConfidence, setExpressionConfidence] = useState<number>(0);

  // Sign Height & Articulation Location Tracking
  const [currentSignHeight, setCurrentSignHeight] = useState<SignHeightZone>('indefinido');
  const [heightConfidence, setHeightConfidence] = useState<number>(0);

  // Initialize MediaPipe Vision Tasks (Hand, Face, Pose)
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipeVision() {
      try {
        setIsModelLoading(true);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        // 1. Initialize Hand Landmarker
        try {
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch (gpuErr) {
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        // 2. Initialize Face Landmarker (NMF - Expressões Não-Manuais)
        try {
          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: true,
          });
        } catch (gpuErr) {
          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: true,
          });
        }

        // 3. Initialize Pose Landmarker (Altura e Ponto de Articulação dos Sinais de Libras)
        try {
          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch (gpuErr) {
          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        if (isMounted) {
          setIsModelLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing MediaPipe vision:', err);
        if (isMounted) {
          setIsModelLoading(false);
        }
      }
    }

    initMediaPipeVision();

    return () => {
      isMounted = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
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

  // Stop camera
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
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Real-time Detection Loop: Hands, Face & Pose Height
  useEffect(() => {
    let lastVideoTime = -1;

    const predictLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const handLandmarker = handLandmarkerRef.current;
      const faceLandmarker = faceLandmarkerRef.current;
      const poseLandmarker = poseLandmarkerRef.current;

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
            const startTimeMs = performance.now();
            const drawingUtils = new DrawingUtils(ctx);

            let poseData: any = null;
            let handYValues: number[] = [];

            // 1. Pose Tracking for Body Frame & Height Reference
            if (poseLandmarker) {
              try {
                const poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
                if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
                  setPoseDetected(true);
                  poseData = poseResults.landmarks[0];

                  if (showPoseSkeleton) {
                    // Draw Pose Connectors
                    drawingUtils.drawConnectors(poseData, PoseLandmarker.POSE_CONNECTIONS, {
                      color: 'rgba(255, 255, 255, 0.4)',
                      lineWidth: 2,
                    });
                    // Key Joints (Shoulders, Elbows, Wrists)
                    drawingUtils.drawLandmarks(poseData, {
                      color: '#FF6B00',
                      fillColor: '#FFFFFF',
                      lineWidth: 1.5,
                      radius: 3,
                    });
                  }
                } else {
                  setPoseDetected(false);
                }
              } catch (e) {
                // frame error ignore
              }
            }

            // 2. Hand Tracking
            if (handLandmarker) {
              try {
                const handResults = handLandmarker.detectForVideo(video, startTimeMs);
                if (handResults && handResults.landmarks && handResults.landmarks.length > 0) {
                  setHandsDetectedCount(handResults.landmarks.length);

                  for (const landmarks of handResults.landmarks) {
                    // Average Y of wrist + MCP joints
                    const wristY = landmarks[0].y;
                    const indexMcpY = landmarks[5].y;
                    const avgY = (wristY + indexMcpY) / 2;
                    handYValues.push(avgY);

                    if (showHandSkeleton) {
                      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                        color: '#FF6B00',
                        lineWidth: 4,
                      });
                      drawingUtils.drawLandmarks(landmarks, {
                        color: '#FFFFFF',
                        fillColor: '#EA580C',
                        lineWidth: 1.5,
                        radius: 4,
                      });
                    }
                  }
                } else {
                  setHandsDetectedCount(0);
                }
              } catch (e) {
                // frame error ignore
              }
            }

            // 3. Face & NMF Expression Tracking
            if (faceLandmarker) {
              try {
                const faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
                if (faceResults && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
                  setFaceDetected(true);
                  const landmarks = faceResults.faceLandmarks[0];

                  if (showFaceMesh) {
                    // Facial Oval & Contours
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
                      color: '#FED7AA',
                      lineWidth: 1.5,
                    });
                    // Eyebrows
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
                      color: '#FF6B00',
                      lineWidth: 3,
                    });
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
                      color: '#FF6B00',
                      lineWidth: 3,
                    });
                    // Lips
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
                      color: '#F97316',
                      lineWidth: 2,
                    });
                  }

                  // Analyze NMF Blendshapes
                  if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
                    const blendshapes = faceResults.faceBlendshapes[0].categories;
                    const getScore = (name: string) => {
                      const shape = blendshapes.find((b) => b.categoryName === name);
                      return shape ? shape.score : 0;
                    };

                    const browInnerUp = getScore('browInnerUp');
                    const browDownLeft = getScore('browDownLeft');
                    const browDownRight = getScore('browDownRight');
                    const mouthSmile = (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2;
                    const jawOpen = getScore('jawOpen');
                    const browFurrow = (browDownLeft + browDownRight) / 2;

                    if (browInnerUp > 0.45) {
                      setCurrentExpression('pergunta_geral');
                      setExpressionConfidence(Math.round(browInnerUp * 100));
                    } else if (browFurrow > 0.35) {
                      setCurrentExpression('duvida_especifica');
                      setExpressionConfidence(Math.round(browFurrow * 100));
                    } else if (mouthSmile > 0.4) {
                      setCurrentExpression('afirmativo_sorriso');
                      setExpressionConfidence(Math.round(mouthSmile * 100));
                    } else if (jawOpen > 0.5) {
                      setCurrentExpression('enfase_espanto');
                      setExpressionConfidence(Math.round(jawOpen * 100));
                    } else {
                      setCurrentExpression('neutro');
                      setExpressionConfidence(0);
                    }
                  }
                } else {
                  setFaceDetected(false);
                  setCurrentExpression('neutro');
                }
              } catch (e) {
                // frame error ignore
              }
            }

            // 4. Calculate Sign Height Relative to Pose Landmarks (Ponto de Articulação - PA)
            if (handYValues.length > 0 && poseData) {
              const activeHandY = Math.min(...handYValues); // highest active hand
              
              const noseY = poseData[0]?.y || 0.25;
              const leftEyeY = poseData[2]?.y || 0.22;
              const mouthY = (poseData[9]?.y + poseData[10]?.y) / 2 || 0.32;
              const leftShoulderY = poseData[11]?.y || 0.42;
              const rightShoulderY = poseData[12]?.y || 0.42;
              const shouldersY = (leftShoulderY + rightShoulderY) / 2;
              const chestY = shouldersY + 0.12;
              const leftHipY = poseData[23]?.y || 0.75;
              const rightHipY = poseData[24]?.y || 0.75;
              const hipsY = (leftHipY + rightHipY) / 2;

              if (activeHandY < leftEyeY - 0.02) {
                setCurrentSignHeight('topo_cabeca_testa');
                setHeightConfidence(95);
              } else if (activeHandY < noseY + 0.03) {
                setCurrentSignHeight('olhos_tempora');
                setHeightConfidence(90);
              } else if (activeHandY < shouldersY - 0.02) {
                setCurrentSignHeight('boca_queixo');
                setHeightConfidence(92);
              } else if (activeHandY < chestY + 0.05) {
                setCurrentSignHeight('peito_tronco');
                setHeightConfidence(88);
              } else if (activeHandY < hipsY) {
                setCurrentSignHeight('espaco_neutro');
                setHeightConfidence(85);
              } else {
                setCurrentSignHeight('abaixo_cintura');
                setHeightConfidence(80);
              }
            } else if (handYValues.length > 0) {
              // Fallback based on normalized screen coordinates
              const avgY = handYValues[0];
              if (avgY < 0.28) {
                setCurrentSignHeight('topo_cabeca_testa');
              } else if (avgY < 0.38) {
                setCurrentSignHeight('boca_queixo');
              } else if (avgY < 0.55) {
                setCurrentSignHeight('peito_tronco');
              } else {
                setCurrentSignHeight('espaco_neutro');
              }
              setHeightConfidence(75);
            } else {
              setCurrentSignHeight('indefinido');
              setHeightConfidence(0);
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
  }, [cameraActive, showHandSkeleton, showFaceMesh, showPoseSkeleton]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    soundService.playTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.log(err));
        setIsFullscreen(false);
      }
    }
  };

  const handleSwitchCamera = () => {
    soundService.playTap();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleToggleMirror = () => {
    soundService.playTap();
    setIsMirrored((prev) => !prev);
  };

  // Height definitions for Libras Articulation Location
  const heightDetails = {
    topo_cabeca_testa: {
      label: 'Testa / Topo da Cabeça',
      icon: '🧠',
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-950/80 border-amber-500/50',
      signs: ['APRENDER', 'SABER', 'PENSAR', 'CONHECER', 'LEMBRAR'],
      desc: 'Ponto de Articulação Superior: Sinais cognitivos, mentais e de memória.'
    },
    olhos_tempora: {
      label: 'Olhos / Têmpora',
      icon: '👁️',
      color: 'from-sky-500 to-blue-600',
      textColor: 'text-sky-400',
      badgeBg: 'bg-sky-950/80 border-sky-500/50',
      signs: ['VER', 'OLHAR', 'DIA', 'AMANHÃ', 'ESTRANHO'],
      desc: 'Ponto de Articulação Visual: Sinais de percepção, observação e tempo.'
    },
    boca_queixo: {
      label: 'Boca / Queixo',
      icon: '👄',
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/80 border-rose-500/50',
      signs: ['COMER', 'BEBER', 'BOM', 'DESCULPA', 'OBRIGADO', 'FALAR'],
      desc: 'Ponto de Articulação Oral: Sinais de alimentação, fala, cortesia e saudação.'
    },
    peito_tronco: {
      label: 'Peito / Tronco Superior',
      icon: '🫁',
      color: 'from-orange-500 to-amber-600',
      textColor: 'text-orange-400',
      badgeBg: 'bg-orange-950/80 border-orange-500/50',
      signs: ['MEU NOME', 'GOSTAR', 'AMAR', 'SAUDADE', 'SENTIR', 'BRASIL'],
      desc: 'Ponto de Articulação Torácico: Sinais de sentimentos, identidade e afeto.'
    },
    espaco_neutro: {
      label: 'Espaço Neutro (À frente do corpo)',
      icon: '🌐',
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/80 border-emerald-500/50',
      signs: ['CASA', 'TRABALHAR', 'AJUDAR', 'LIVRO', 'CARRO', 'LIBRAS', 'ESTUDAR'],
      desc: 'Ponto de Articulação Neutro: Maioria dos sinais descritivos, verbos e objetos.'
    },
    abaixo_cintura: {
      label: 'Abaixo da Cintura',
      icon: '🔽',
      color: 'from-stone-600 to-stone-800',
      textColor: 'text-stone-400',
      badgeBg: 'bg-stone-900/80 border-stone-600/50',
      signs: ['SENTAR', 'CAMINHAR', 'ABAIXO'],
      desc: 'Posição baixa: Movimentos de locomoção e espaço inferior.'
    },
    indefinido: {
      label: 'Posicione as mãos na câmera',
      icon: '🤟',
      color: 'from-stone-700 to-stone-900',
      textColor: 'text-stone-400',
      badgeBg: 'bg-stone-950/80 border-stone-800',
      signs: [],
      desc: 'Sinalize em frente à webcam para detectar a altura e o ponto de articulação.'
    }
  };

  const currentHeightInfo = heightDetails[currentSignHeight];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      
      {/* Top Floating Controls Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between pointer-events-auto">
        
        {/* Back Button */}
        {onClose && (
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
        )}

        {/* Live Status Badges (Holistic Vision: Hands, Face, Pose) */}
        <div className="flex items-center gap-2">
          {isModelLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-bold text-amber-400 backdrop-blur-md">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Iniciando IA Holistic EasyLib...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Hands */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black backdrop-blur-md border ${
                handsDetectedCount > 0 ? 'bg-orange-950/80 border-orange-500/50 text-orange-400' : 'bg-black/50 border-white/10 text-stone-500'
              }`}>
                <Hand className="w-3.5 h-3.5" />
                <span>{handsDetectedCount > 0 ? `${handsDetectedCount} Mão(s)` : 'Sem Mãos'}</span>
              </div>

              {/* Pose / Height */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black backdrop-blur-md border ${
                poseDetected ? 'bg-amber-950/80 border-amber-500/50 text-amber-400' : 'bg-black/50 border-white/10 text-stone-500'
              }`}>
                <User className="w-3.5 h-3.5" />
                <span>{poseDetected ? 'Corpo / Altura PA' : 'Sem Pose'}</span>
              </div>

              {/* Face NMF */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black backdrop-blur-md border ${
                faceDetected ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-black/50 border-white/10 text-stone-500'
              }`}>
                <Smile className="w-3.5 h-3.5" />
                <span>{faceDetected ? 'NMF Facial' : 'Sem Rosto'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Camera Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Toggle Pose Skeleton */}
          <button
            onClick={() => {
              soundService.playTap();
              setShowPoseSkeleton((prev) => !prev);
            }}
            title={showPoseSkeleton ? 'Ocultar esqueleto corporal' : 'Exibir esqueleto corporal'}
            className={`p-2.5 sm:p-3 rounded-2xl border font-black text-xs backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
              showPoseSkeleton
                ? 'bg-[#FF6B00] text-white border-[#EA580C]'
                : 'bg-black/60 hover:bg-black/80 text-stone-400 border-white/20'
            }`}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Toggle Hand Skeleton */}
          <button
            onClick={() => {
              soundService.playTap();
              setShowHandSkeleton((prev) => !prev);
            }}
            title={showHandSkeleton ? 'Ocultar esqueleto das mãos' : 'Exibir esqueleto das mãos'}
            className={`p-2.5 sm:p-3 rounded-2xl border font-black text-xs backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
              showHandSkeleton
                ? 'bg-[#FF6B00] text-white border-[#EA580C]'
                : 'bg-black/60 hover:bg-black/80 text-stone-400 border-white/20'
            }`}
          >
            <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Toggle Face Mesh */}
          <button
            onClick={() => {
              soundService.playTap();
              setShowFaceMesh((prev) => !prev);
            }}
            title={showFaceMesh ? 'Ocultar malha facial (NMF)' : 'Exibir malha facial (NMF)'}
            className={`p-2.5 sm:p-3 rounded-2xl border font-black text-xs backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
              showFaceMesh
                ? 'bg-[#FF6B00] text-white border-[#EA580C]'
                : 'bg-black/60 hover:bg-black/80 text-stone-400 border-white/20'
            }`}
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Toggle Mirror */}
          <button
            onClick={handleToggleMirror}
            title="Espelhar Imagem"
            className={`p-2.5 sm:p-3 rounded-2xl border font-black text-xs backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
              isMirrored
                ? 'bg-[#FF6B00] text-white border-[#EA580C]'
                : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
            }`}
          >
            <FlipHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Switch Facing Mode (Front / Back) */}
          <button
            onClick={handleSwitchCamera}
            title="Trocar Câmera"
            className="p-2.5 sm:p-3 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 font-black text-xs backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title="Tela Cheia"
            className="p-2.5 sm:p-3 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 font-black text-xs backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </header>

      {/* Main Full-Screen Video & Overlays Canvas */}
      <div className="relative w-full h-full flex items-center justify-center bg-[#0C0A09]">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* Overlay Landmarks Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* Right Floating Height Scale Meter (Medidor de Altura do Ponto de Articulação) */}
        <aside className="absolute right-4 top-24 bottom-28 w-14 sm:w-16 z-20 flex flex-col justify-between py-2 px-1 rounded-3xl bg-black/70 backdrop-blur-xl border border-white/15 text-[10px] font-black items-center pointer-events-none shadow-2xl">
          
          <div className="text-[9px] text-amber-400 uppercase tracking-tighter text-center leading-none mb-1">
            ALTURA DO SINAL
          </div>

          {/* Zones */}
          <div className={`w-full py-2 rounded-xl flex flex-col items-center transition-all ${
            currentSignHeight === 'topo_cabeca_testa' ? 'bg-amber-500 text-white shadow-lg scale-110 font-bold' : 'text-stone-400 opacity-60'
          }`}>
            <span className="text-xs">🧠</span>
            <span className="text-[8px]">Testa</span>
          </div>

          <div className={`w-full py-2 rounded-xl flex flex-col items-center transition-all ${
            currentSignHeight === 'olhos_tempora' ? 'bg-sky-500 text-white shadow-lg scale-110 font-bold' : 'text-stone-400 opacity-60'
          }`}>
            <span className="text-xs">👁️</span>
            <span className="text-[8px]">Olhos</span>
          </div>

          <div className={`w-full py-2 rounded-xl flex flex-col items-center transition-all ${
            currentSignHeight === 'boca_queixo' ? 'bg-rose-500 text-white shadow-lg scale-110 font-bold' : 'text-stone-400 opacity-60'
          }`}>
            <span className="text-xs">👄</span>
            <span className="text-[8px]">Boca</span>
          </div>

          <div className={`w-full py-2 rounded-xl flex flex-col items-center transition-all ${
            currentSignHeight === 'peito_tronco' ? 'bg-orange-500 text-white shadow-lg scale-110 font-bold' : 'text-stone-400 opacity-60'
          }`}>
            <span className="text-xs">🫁</span>
            <span className="text-[8px]">Peito</span>
          </div>

          <div className={`w-full py-2 rounded-xl flex flex-col items-center transition-all ${
            currentSignHeight === 'espaco_neutro' ? 'bg-emerald-500 text-white shadow-lg scale-110 font-bold' : 'text-stone-400 opacity-60'
          }`}>
            <span className="text-xs">🌐</span>
            <span className="text-[8px]">Neutro</span>
          </div>

          <div className={`w-full py-2 rounded-xl flex flex-col items-center transition-all ${
            currentSignHeight === 'abaixo_cintura' ? 'bg-stone-600 text-white shadow-lg scale-110 font-bold' : 'text-stone-400 opacity-40'
          }`}>
            <span className="text-xs">🔽</span>
            <span className="text-[8px]">Baixo</span>
          </div>

        </aside>

        {/* Bottom Real-time Ponto de Articulação & Altura Feedback HUD */}
        <div className="absolute bottom-4 left-4 right-20 sm:right-24 z-30 max-w-xl mx-auto p-3.5 sm:p-4 rounded-3xl backdrop-blur-xl border-2 shadow-2xl flex flex-col sm:flex-row items-center gap-3.5 animate-slide-up bg-black/85 border-[#FF6B00]">
          
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br ${currentHeightInfo.color} text-white shadow-md`}>
            {currentHeightInfo.icon}
          </div>

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-black text-xs uppercase tracking-wider text-[#FF6B00]">
                Ponto de Articulação (PA) • Altura
              </span>
              {heightConfidence > 0 && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {heightConfidence}% Precisão
                </span>
              )}
            </div>

            <h4 className="font-black text-base text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>{currentHeightInfo.label}</span>
            </h4>

            <p className="text-[11px] text-stone-300 font-medium leading-tight">
              {currentHeightInfo.desc}
            </p>

            {/* Matching signs for this height zone */}
            {currentHeightInfo.signs.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                <span className="text-[10px] font-black text-stone-400">Exemplos de sinais:</span>
                {currentHeightInfo.signs.map((sign, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[10px] font-bold border border-white/10">
                    {sign}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Camera Inactive / Permission Prompt */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90 space-y-4 z-20">
            <div className="w-20 h-20 rounded-3xl bg-[#FF6B00]/20 border-2 border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] animate-pulse">
              <Camera className="w-10 h-10" />
            </div>
            
            <div className="space-y-1 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Câmera com Rastreamento Corporal & Altura dos Sinais
              </h2>
              <p className="text-sm text-stone-300">
                {cameraError || 'Iniciando câmera para rastrear mãos, postura, expressões faciais e altura do ponto de articulação em Libras...'}
              </p>
            </div>

            <button
              onClick={startCamera}
              className="px-6 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-sm uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-xl transition-all active:translate-y-0.5"
            >
              Permitir e Ligar Câmera
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
