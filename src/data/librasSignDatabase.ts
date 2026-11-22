import { LibrasSignSpecification } from '../types/librasRecognition';

/**
 * Banco Estruturado de Sinais da Libras
 *
 * Fontes linguísticas reais consultadas como referência descritiva dos 5 parâmetros:
 * - SignBank Libras (UFSC): https://signbank.libras.ufsc.br/
 * - Corpus de Libras (UFSC): https://corpuslibras.ufsc.br/
 * - Spread the Sign (Português Brasileiro - Libras): https://www.spreadthesign.com/pt.br/
 * - INES (Dicionário da Língua Brasileira de Sinais): https://www.ines.gov.br/dicionario-de-libras/
 * - Suite VLibras / V-LIBRASIL: https://www.vlibras.gov.br/
 *
 * Nota de transparência linguística:
 * Sinais marcados com `validationStatus: 'validated'` possuem assinaturas geométricas 3D
 * e cinemáticas temporais verificáveis via MediaPipe Holistic/Hand+Pose+Face.
 * Sinais compostos ou com alta variação/oclusão estão marcados como `pending_validation`
 * e não são auto-confirmados como validados até integração com dataset treinado em vídeo.
 */

export const LIBRAS_SIGN_DATABASE: LibrasSignSpecification[] = [
  {
    id: 'tudo_bem',
    name: 'Positivo / Tudo Bem',
    gloss: 'TUDO_BEM',
    portugueseTranslations: ['Tudo bem', 'Tudo ótimo', 'Combinado / Positivo'],
    category: 'Saudações',
    icon: '👍',
    description: 'Mão fechada com polegar estendido para cima (joinha) no espaço neutro à frente do peito. (Forma completa em Libras combina BOM + POSITIVO.)',
    handshapeName: 'Punho fechado com polegar estendido para cima (Joinha)',
    palmOrientationLabel: 'Palma voltada medialmente (para o centro do corpo)',
    articulationLocationLabel: 'Espaço neutro à frente do tórax',
    initialPosition: 'Mão na altura do peito',
    finalPosition: 'Mão mantida ou levemente projetada à frente',
    trajectoryDescription: 'Sustentação estável ou leve avanço frontal com expressão interrogativa/positiva',
    movementType: 'static',
    facialExpressionLabel: 'Interrogativa (sobrancelhas erguidas) na pergunta ou sorriso na resposta',
    expectedNmf: ['interrogative_brows_up', 'positive_smile', 'neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['chest', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.65, 1.0],
      index: [0.0, 0.35],
      middle: [0.0, 0.35],
      ring: [0.0, 0.35],
      pinky: [0.0, 0.35]
    },
    allowedPalmFacings: ['inward', 'outward', 'camera', 'signer', 'any'],
    requiresMotion: false,
    minConfidence: 0.78,
    validationStatus: 'validated',
    validationNotes: 'Configuração de mão inequívoca (apenas polegar estendido, 4 dedos fletidos em 3D) no espaço neutro/peito.',
    linguisticSource: {
      name: 'INES — Dicionário da Língua Brasileira de Sinais / Spread the Sign (PT-BR)',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=tudo+bem',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (Libras)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=tudo+bem',
      notes: 'Consulte o vídeo oficial do sinalizador no Spread the Sign ou SignBank UFSC.'
    }
  },
  {
    id: 'amor',
    name: 'Eu Te Amo (ILY)',
    gloss: 'AMOR',
    portugueseTranslations: ['Eu te amo', 'Amor / Carinho'],
    category: 'Expressões',
    icon: '🤟',
    description: 'Configuração universal I-L-Y (polegar, indicador e mínimo estendidos simultaneamente; médio e anelar dobrados), palma voltada para o interlocutor.',
    handshapeName: 'Configuração I-L-Y (polegar, indicador e mínimo estendidos)',
    palmOrientationLabel: 'Palma voltada para frente (interlocutor)',
    articulationLocationLabel: 'Espaço neutro na altura do peito / ombro',
    initialPosition: 'Mão no espaço neutro',
    finalPosition: 'Mão projetada suavemente para frente',
    trajectoryDescription: 'Sustentação ou leve projeção frontal',
    movementType: 'static',
    facialExpressionLabel: 'Sorriso acolhedor e expressão afetiva',
    expectedNmf: ['positive_smile', 'neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['chest', 'neutral_space', 'above_shoulder'],
    handshapeProfile: {
      thumb: [0.6, 1.0],
      index: [0.65, 1.0],
      middle: [0.0, 0.35],
      ring: [0.0, 0.35],
      pinky: [0.6, 1.0]
    },
    allowedPalmFacings: ['camera', 'inward', 'outward'],
    requiresMotion: false,
    minConfidence: 0.80,
    validationStatus: 'validated',
    validationNotes: 'Assinatura angular 3D única (indicador + mínimo + polegar estendidos; médio + anelar fletidos).',
    linguisticSource: {
      name: 'INES / Cultura Surda — Sinal emblemático ILY',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=eu+te+amo',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (Libras)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=eu+te+amo',
      notes: 'Referência externa verificável de sinalização real.'
    }
  },
  {
    id: 'paz',
    name: 'Paz',
    gloss: 'PAZ',
    portugueseTranslations: ['Paz', 'Tranquilidade'],
    category: 'Expressões',
    icon: '✌️',
    description: 'Mão em configuração de V (dedos indicador e médio estendidos e separados, demais dedos fechados), palma voltada para frente.',
    handshapeName: "Configuração em 'V' (indicador e médio estendidos e separados)",
    palmOrientationLabel: 'Palma voltada para frente (câmera)',
    articulationLocationLabel: 'Espaço neutro à frente do ombro ou peito',
    initialPosition: 'Espaço neutro superior/médio',
    finalPosition: 'Espaço neutro',
    trajectoryDescription: 'Sustentação estável em V',
    movementType: 'static',
    facialExpressionLabel: 'Expressão serena',
    expectedNmf: ['neutral', 'positive_smile', 'any'],
    twoHanded: 1,
    referencePoints: ['neutral_space', 'chest', 'above_shoulder'],
    handshapeProfile: {
      thumb: [0.0, 0.65],
      index: [0.7, 1.0],
      middle: [0.7, 1.0],
      ring: [0.0, 0.32],
      pinky: [0.0, 0.32],
      minIndexMiddleSpread: 14
    },
    allowedPalmFacings: ['camera', 'signer'],
    requiresMotion: false,
    minConfidence: 0.78,
    validationStatus: 'validated',
    validationNotes: 'Exige indicador e médio estendidos com ângulo mínimo de abertura entre eles (> 14°), evitando falso positivo com mão em U.',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) / INES',
      url: 'https://signbank.libras.ufsc.br/',
      verified: true
    },
    videoReference: {
      sourceName: 'SignBank Libras (UFSC)',
      externalUrl: 'https://signbank.libras.ufsc.br/',
      notes: 'Consulte o verbete PAZ no SignBank da UFSC.'
    }
  },
  {
    id: 'oi',
    name: 'Oi / Olá',
    gloss: 'OI',
    portugueseTranslations: ['Oi', 'Olá'],
    category: 'Saudações',
    icon: '👋',
    description: 'Mão aberta na altura do ombro/espaço lateral realizando movimento lateral oscilatório (aceno), com expressão amigável.',
    handshapeName: "Mão aberta em '5' (ou transição 'O' para 'I')",
    palmOrientationLabel: 'Palma voltada para frente',
    articulationLocationLabel: 'Acima da linha do ombro / lateral superior',
    initialPosition: 'Lateral do ombro',
    finalPosition: 'Oscilação lateral esquerda-direita',
    trajectoryDescription: 'Movimento oscilatório lateral repetido no espaço lateral superior',
    movementType: 'oscillating_lateral',
    facialExpressionLabel: 'Sorriso amigável',
    expectedNmf: ['positive_smile', 'neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['above_shoulder', 'neck_shoulder', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.45, 1.0],
      index: [0.7, 1.0],
      middle: [0.7, 1.0],
      ring: [0.7, 1.0],
      pinky: [0.7, 1.0]
    },
    allowedPalmFacings: ['camera'],
    requiresMotion: true,
    minConfidence: 0.78,
    dtwTrajectoryTemplate: [
      { x: -0.18, y: 0, z: 0 },
      { x: 0.18, y: 0, z: 0 },
      { x: -0.18, y: 0, z: 0 },
      { x: 0.18, y: 0, z: 0 }
    ],
    validationStatus: 'validated',
    validationNotes: 'Exige mão aberta com palma para frente E oscilação lateral real na trajetória temporal; mão parada não dispara OI.',
    linguisticSource: {
      name: 'Spread the Sign (Libras) / Corpus de Libras UFSC',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=oi',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=oi',
      notes: 'Demonstração real disponível no catálogo Spread the Sign.'
    }
  },
  {
    id: 'obrigado',
    name: 'Obrigado(a)',
    gloss: 'OBRIGADO',
    portugueseTranslations: ['Obrigado(a)', 'Muito obrigado(a)'],
    category: 'Cortesia',
    icon: '🙏',
    description: 'Mão aberta em B (dedos unidos) parte da testa ou região do queixo/boca movendo-se para frente em direção ao interlocutor.',
    handshapeName: "Mão espalmada em 'B' (4 dedos estendidos juntos)",
    palmOrientationLabel: 'Palma voltada para dentro (rosto) / para baixo ao avançar',
    articulationLocationLabel: 'Testa ou queixo em direção ao espaço neutro frontal',
    initialPosition: 'Próximo à testa / queixo',
    finalPosition: 'Espaço neutro à frente',
    trajectoryDescription: 'Movimento retilíneo ou leve arco do rosto para frente (afastamento na direção Z/Y)',
    movementType: 'forward_away',
    facialExpressionLabel: 'Expressão de gratidão e leve inclinação de cabeça',
    expectedNmf: ['positive_smile', 'affirmative_nod', 'neutral', 'any'],
    twoHanded: '1_or_2',
    referencePoints: ['forehead', 'nose_mouth', 'chin', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.0, 0.85],
      index: [0.68, 1.0],
      middle: [0.68, 1.0],
      ring: [0.68, 1.0],
      pinky: [0.68, 1.0],
      maxIndexMiddleSpread: 22
    },
    allowedPalmFacings: ['signer', 'down', 'inward'],
    requiresMotion: true,
    minConfidence: 0.78,
    dtwTrajectoryTemplate: [
      { x: 0, y: -0.25, z: 0.1 },
      { x: 0, y: -0.15, z: 0.02 },
      { x: 0, y: 0.0, z: -0.15 }
    ],
    validationStatus: 'validated',
    validationNotes: 'Exige mão espalmada com dedos juntos (não aceno lateral), palma para si/baixo na região facial e movimento para frente.',
    linguisticSource: {
      name: 'INES / SignBank Libras (UFSC)',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=obrigado',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=obrigado',
      notes: 'Referência oficial em vídeo no Spread the Sign / SignBank UFSC.'
    }
  },
  {
    id: 'por_favor',
    name: 'Por Favor',
    gloss: 'POR_FAVOR',
    portugueseTranslations: ['Por favor', 'Por gentileza'],
    category: 'Cortesia',
    icon: '🤲',
    description: 'Duas mãos espalmadas (configuração B) unidas palma com palma em frente ao peito, com leve movimento de solicitação.',
    handshapeName: "Duas mãos abertas em 'B'",
    palmOrientationLabel: 'Palmas voltadas uma para a outra (mediais)',
    articulationLocationLabel: 'Espaço neutro em frente ao peito',
    initialPosition: 'Mãos juntas em frente ao tórax',
    finalPosition: 'Mãos juntas em frente ao tórax',
    trajectoryDescription: 'Contato simétrico entre as duas palmas em frente ao peito',
    movementType: 'two_hand_contact',
    facialExpressionLabel: 'Expressão cortês / solicita',
    expectedNmf: ['neutral', 'positive_smile', 'interrogative_brows_up', 'any'],
    twoHanded: 2,
    referencePoints: ['chest', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.2, 1.0],
      index: [0.65, 1.0],
      middle: [0.65, 1.0],
      ring: [0.65, 1.0],
      pinky: [0.65, 1.0]
    },
    allowedPalmFacings: ['inward', 'up', 'camera', 'signer'],
    requiresMotion: false,
    minConfidence: 0.80,
    validationStatus: 'validated',
    validationNotes: 'Exige rigorosamente 2 mãos presentes com proximidade de punhos e pontas dos dedos em frente ao peito.',
    linguisticSource: {
      name: 'INES — Dicionário de Libras / Spread the Sign',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=por+favor',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=por+favor',
      notes: 'Verifique variações regionais no Corpus de Libras UFSC.'
    }
  },
  {
    id: 'casa',
    name: 'Casa',
    gloss: 'CASA',
    portugueseTranslations: ['Casa', 'Lar / Residência'],
    category: 'Lugares',
    icon: '🏠',
    description: 'Ambas as mãos abertas (em B) unidas pelas pontas dos dedos formando um ângulo de telhado triangular em frente ao tronco.',
    handshapeName: "Duas mãos abertas em 'B' inclinadas em telhado",
    palmOrientationLabel: 'Palmas voltadas diagonalmente para baixo/dentro',
    articulationLocationLabel: 'Espaço neutro na altura do peito',
    initialPosition: 'Mãos afastadas lateralmente',
    finalPosition: 'Pontas dos dedos tocando no ápice, punhos afastados para baixo',
    trajectoryDescription: 'Convergência simétrica das pontas dos dedos no topo com punhos inferiores afastados',
    movementType: 'two_hand_roof',
    facialExpressionLabel: 'Expressão neutra',
    expectedNmf: ['neutral', 'any'],
    twoHanded: 2,
    referencePoints: ['chest', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.1, 1.0],
      index: [0.68, 1.0],
      middle: [0.68, 1.0],
      ring: [0.68, 1.0],
      pinky: [0.68, 1.0]
    },
    allowedPalmFacings: ['inward', 'down', 'signer', 'camera'],
    requiresMotion: false,
    minConfidence: 0.82,
    validationStatus: 'validated',
    validationNotes: 'Exige 2 mãos com pontas dos dedos próximas (< 0.85 palmScale) E punhos afastados (> 1.35 palmScale) abaixo das pontas.',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) / INES',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=casa',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=casa',
      notes: 'Referência padrão de Libras.'
    }
  },
  {
    id: 'ajudar',
    name: 'Ajudar',
    gloss: 'AJUDAR',
    portugueseTranslations: ['Ajudar', 'Auxiliar'],
    category: 'Ações',
    icon: '🤝',
    description: 'Mão dominante fechada (configuração A) apoiada sobre a palma aberta da outra mão, movendo-se no espaço conforme a concordância verbal.',
    handshapeName: "Mão fechada em 'A' sobre palma aberta em 'B'",
    palmOrientationLabel: 'Mão de apoio com palma para cima',
    articulationLocationLabel: 'Espaço neutro à frente do peito',
    initialPosition: 'Punho apoiado na palma contrária',
    finalPosition: 'Conjunto projetado para frente ou para o receptor',
    trajectoryDescription: 'Apoio conjunto de punho sobre palma aberta',
    movementType: 'two_hand_support',
    facialExpressionLabel: 'Expressão solidária / interrogativa se pedido',
    expectedNmf: ['neutral', 'interrogative_brows_up', 'positive_smile', 'any'],
    twoHanded: 2,
    referencePoints: ['chest', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.2, 1.0],
      index: [0.0, 1.0],
      middle: [0.0, 1.0],
      ring: [0.0, 1.0],
      pinky: [0.0, 1.0]
    },
    allowedPalmFacings: ['any'],
    requiresMotion: false,
    minConfidence: 0.80,
    validationStatus: 'validated',
    validationNotes: 'Exige exatamente 1 mão em punho fechado e 1 mão aberta próximas entre si.',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) — Verbo direcional AJUDAR',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=ajudar',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=ajudar',
      notes: 'Verbo com concordância direcional (EU-AJUDO-VOCÊ / VOCÊ-ME-AJUDA).'
    }
  },
  {
    id: 'libras',
    name: 'Libras',
    gloss: 'LIBRAS',
    portugueseTranslations: ['Libras', 'Língua Brasileira de Sinais'],
    category: 'Língua',
    icon: '👐',
    description: 'Ambas as mãos abertas em frente ao peito realizando movimentos circulares alternados no ar.',
    handshapeName: "Duas mãos abertas em '5'",
    palmOrientationLabel: 'Palmas voltadas para baixo / frente em rotação',
    articulationLocationLabel: 'Espaço neutro em frente ao peito',
    initialPosition: 'Duas mãos abertas à frente do tronco',
    finalPosition: 'Movimento circular alternado contínuo',
    trajectoryDescription: 'Movimento circular alternado simultâneo das duas mãos',
    movementType: 'two_hand_alternating',
    facialExpressionLabel: 'Expressão neutra / entusiasmo',
    expectedNmf: ['neutral', 'positive_smile', 'any'],
    twoHanded: 2,
    referencePoints: ['chest', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.4, 1.0],
      index: [0.65, 1.0],
      middle: [0.65, 1.0],
      ring: [0.65, 1.0],
      pinky: [0.65, 1.0]
    },
    allowedPalmFacings: ['any'],
    requiresMotion: true,
    minConfidence: 0.80,
    validationStatus: 'validated',
    validationNotes: 'Exige 2 mãos abertas afastadas E movimento ativo alternado/circular (duas mãos paradas não disparam LIBRAS).',
    linguisticSource: {
      name: 'INES / Corpus de Libras UFSC',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=libras',
      verified: true
    },
    videoReference: {
      sourceName: 'Corpus de Libras / Spread the Sign',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=libras',
      notes: 'Sinal oficial da Língua Brasileira de Sinais.'
    }
  },
  {
    id: 'eu',
    name: 'Eu',
    gloss: 'EU',
    portugueseTranslations: ['Eu', 'Mim'],
    category: 'Pronomes',
    icon: '👉',
    description: 'Dedo indicador estendido (configuração 1/D) apontando diretamente para o centro do próprio peito.',
    handshapeName: "Configuração em '1' / 'D' (apenas indicador estendido)",
    palmOrientationLabel: 'Palma voltada para baixo ou medial',
    articulationLocationLabel: 'Centro do peito (tórax)',
    initialPosition: 'Espaço próximo ao peito',
    finalPosition: 'Toque ou apontamento para o próprio peito',
    trajectoryDescription: 'Movimento curto em direção ao próprio peito ou sustentação apontada ao tórax',
    movementType: 'towards_body',
    facialExpressionLabel: 'Neutra',
    expectedNmf: ['neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['chest'],
    handshapeProfile: {
      thumb: [0.0, 0.7],
      index: [0.72, 1.0],
      middle: [0.0, 0.35],
      ring: [0.0, 0.35],
      pinky: [0.0, 0.35]
    },
    allowedPalmFacings: ['signer', 'down', 'inward'],
    requiresMotion: false,
    minConfidence: 0.78,
    validationStatus: 'validated',
    validationNotes: 'Distingue-se de VOCÊ e NÃO por exigir vetor 3D do indicador apontando para o tórax/dentro (z > 0 ou direção medial ao peito).',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) / INES',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=eu',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=eu',
      notes: 'Pronome pessoal de 1ª pessoa.'
    }
  },
  {
    id: 'voce',
    name: 'Você',
    gloss: 'VOCE',
    portugueseTranslations: ['Você', 'Tu'],
    category: 'Pronomes',
    icon: '🫵',
    description: 'Dedo indicador estendido apontando diretamente para frente na direção do interlocutor (câmera) na altura do peito/espaço neutro.',
    handshapeName: "Configuração em '1' / 'D' (indicador estendido)",
    palmOrientationLabel: 'Palma para baixo ou medial',
    articulationLocationLabel: 'Espaço neutro à frente do peito',
    initialPosition: 'Espaço neutro',
    finalPosition: 'Apontamento frontal para o interlocutor',
    trajectoryDescription: 'Projeção ou apontamento frontal na direção do eixo Z negativo (câmera)',
    movementType: 'forward_away',
    facialExpressionLabel: 'Neutra ou interrogativa',
    expectedNmf: ['neutral', 'interrogative_brows_up', 'any'],
    twoHanded: 1,
    referencePoints: ['neutral_space', 'chest'],
    handshapeProfile: {
      thumb: [0.0, 0.7],
      index: [0.72, 1.0],
      middle: [0.0, 0.35],
      ring: [0.0, 0.35],
      pinky: [0.0, 0.35]
    },
    allowedPalmFacings: ['down', 'inward', 'outward', 'camera'],
    requiresMotion: false,
    minConfidence: 0.78,
    validationStatus: 'validated',
    validationNotes: 'Usa vetor 3D da falange do indicador (tip.z < mcp.z) no espaço neutro, evitando falha por encurtamento 2D.',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) / INES',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=voc%C3%AA',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=voc%C3%AA',
      notes: 'Pronome pessoal de 2ª pessoa.'
    }
  },
  {
    id: 'nao',
    name: 'Não',
    gloss: 'NAO',
    portugueseTranslations: ['Não'],
    category: 'Respostas',
    icon: '☝️',
    description: 'Dedo indicador estendido na vertical oscilando lateralmente de um lado para o outro, frequentemente acompanhado de movimento negativo da cabeça.',
    handshapeName: "Configuração em '1' / 'D' (indicador vertical)",
    palmOrientationLabel: 'Palma voltada para frente',
    articulationLocationLabel: 'Espaço neutro / altura do ombro',
    initialPosition: 'Indicador vertical no espaço neutro',
    finalPosition: 'Oscilação lateral repetida',
    trajectoryDescription: 'Oscilação lateral rápida e repetida do dedo indicador na vertical',
    movementType: 'oscillating_lateral',
    facialExpressionLabel: 'Negação com movimento lateral da cabeça (NMF)',
    expectedNmf: ['negative_head_shake', 'neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['above_shoulder', 'neutral_space', 'neck_shoulder'],
    handshapeProfile: {
      thumb: [0.0, 0.7],
      index: [0.72, 1.0],
      middle: [0.0, 0.35],
      ring: [0.0, 0.35],
      pinky: [0.0, 0.35]
    },
    allowedPalmFacings: ['camera'],
    requiresMotion: true,
    minConfidence: 0.80,
    dtwTrajectoryTemplate: [
      { x: -0.14, y: 0, z: 0 },
      { x: 0.14, y: 0, z: 0 },
      { x: -0.14, y: 0, z: 0 },
      { x: 0.14, y: 0, z: 0 }
    ],
    validationStatus: 'validated',
    validationNotes: 'Exige oscilação lateral real (inversões de direção em X) OU movimento negativo claro da cabeça com indicador vertical; indicador parado não dispara NÃO.',
    linguisticSource: {
      name: 'Corpus de Libras (UFSC) / INES',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=n%C3%A3o',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=n%C3%A3o',
      notes: 'Negação manual + NMF de cabeça.'
    }
  },
  {
    id: 'sim',
    name: 'Sim',
    gloss: 'SIM',
    portugueseTranslations: ['Sim'],
    category: 'Respostas',
    icon: '✊',
    description: 'Mão fechada (configuração S) com flexão repetida do punho para cima e para baixo, acompanhada de leve aceno afirmativo da cabeça.',
    handshapeName: "Punho fechado em 'S'",
    palmOrientationLabel: 'Palma voltada para frente / baixo',
    articulationLocationLabel: 'Espaço neutro à frente do corpo',
    initialPosition: 'Punho erguido no espaço neutro',
    finalPosition: 'Flexão vertical repetida do punho (sim-sim)',
    trajectoryDescription: 'Movimento vertical oscilante (subida e descida afirmativa)',
    movementType: 'nodding_vertical',
    facialExpressionLabel: 'Afirmação com aceno de cabeça',
    expectedNmf: ['affirmative_nod', 'positive_smile', 'neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['neutral_space', 'chest'],
    handshapeProfile: {
      thumb: [0.0, 0.6],
      index: [0.0, 0.32],
      middle: [0.0, 0.32],
      ring: [0.0, 0.32],
      pinky: [0.0, 0.32]
    },
    allowedPalmFacings: ['camera', 'down', 'inward'],
    requiresMotion: true,
    minConfidence: 0.80,
    dtwTrajectoryTemplate: [
      { x: 0, y: -0.1, z: 0 },
      { x: 0, y: 0.1, z: 0 },
      { x: 0, y: -0.1, z: 0 },
      { x: 0, y: 0.1, z: 0 }
    ],
    validationStatus: 'validated',
    validationNotes: 'Exige movimento vertical real (nodding_vertical) com punho fechado; punho parado descansando NÃO dispara SIM.',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) / INES',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=sim',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=sim',
      notes: 'Afirmação em Libras.'
    }
  },
  {
    id: 'agua',
    name: 'Água',
    gloss: 'AGUA',
    portugueseTranslations: ['Água', 'Beber água'],
    category: 'Alimentação',
    icon: '💧',
    description: 'Mão em configuração de L com o polegar/indicador tocando o queixo em leve movimento oscilatório.',
    handshapeName: "Configuração em 'L' (polegar e indicador em 90°)",
    palmOrientationLabel: 'Palma voltada para o lado / dentro',
    articulationLocationLabel: 'Queixo',
    initialPosition: 'Mão em L junto ao queixo',
    finalPosition: 'Toque leve no queixo',
    trajectoryDescription: 'Articulação junto ao queixo',
    movementType: 'static',
    facialExpressionLabel: 'Neutra',
    expectedNmf: ['neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['chin', 'nose_mouth'],
    handshapeProfile: {
      thumb: [0.62, 1.0],
      index: [0.7, 1.0],
      middle: [0.0, 0.34],
      ring: [0.0, 0.34],
      pinky: [0.0, 0.34],
      minThumbIndexTipDist: 0.75
    },
    allowedPalmFacings: ['inward', 'outward', 'signer', 'camera'],
    requiresMotion: false,
    minConfidence: 0.79,
    validationStatus: 'validated',
    validationNotes: 'Combina configuração rigorosa em L + localização obrigatória na zona do queixo/boca.',
    linguisticSource: {
      name: 'INES — Dicionário da Língua Brasileira de Sinais',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=%C3%A1gua',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=%C3%A1gua',
      notes: 'Sinal clássico de ÁGUA em Libras.'
    }
  },
  {
    id: 'comer',
    name: 'Comer',
    gloss: 'COMER',
    portugueseTranslations: ['Comer', 'Alimentar-se'],
    category: 'Ações',
    icon: '🍽️',
    description: 'Mão com as pontas dos dedos unidas (em coxinha/pinça) levada repetidamente em direção à boca.',
    handshapeName: 'Pontas dos dedos unidas em pinça/coxinha',
    palmOrientationLabel: 'Palma voltada para a boca',
    articulationLocationLabel: 'Região da boca / queixo',
    initialPosition: 'Espaço à frente da boca',
    finalPosition: 'Aproximação repetida aos lábios',
    trajectoryDescription: 'Movimento repetido de aproximação aos lábios',
    movementType: 'repetitive_to_mouth',
    facialExpressionLabel: 'Neutra',
    expectedNmf: ['neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['nose_mouth', 'chin'],
    handshapeProfile: {
      thumb: [0.25, 0.9],
      index: [0.15, 0.75],
      middle: [0.1, 0.75],
      ring: [0.0, 0.7],
      pinky: [0.0, 0.7],
      maxThumbIndexTipDist: 0.42
    },
    allowedPalmFacings: ['signer', 'up', 'inward'],
    requiresMotion: true,
    minConfidence: 0.79,
    dtwTrajectoryTemplate: [
      { x: 0, y: 0.05, z: -0.1 },
      { x: 0, y: 0.0, z: 0.08 },
      { x: 0, y: 0.05, z: -0.08 },
      { x: 0, y: 0.0, z: 0.08 }
    ],
    validationStatus: 'validated',
    validationNotes: 'Exige pinça/pontas próximas + localização na boca/queixo + movimento oscilatório em direção à boca.',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) / INES',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=comer',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=comer',
      notes: 'Verbo de ação cotidiana.'
    }
  },
  {
    id: 'gostar',
    name: 'Gostar',
    gloss: 'GOSTAR',
    portugueseTranslations: ['Gostar', 'Apreciar'],
    category: 'Sentimentos',
    icon: '❤️',
    description: 'Palma da mão aberta espalmada deslizando em movimento circular suave sobre o centro do peito.',
    handshapeName: "Mão aberta espalmada em '5' ou 'B'",
    palmOrientationLabel: 'Palma voltada para o peito (signer)',
    articulationLocationLabel: 'Centro do peito (tórax)',
    initialPosition: 'Palma no peito',
    finalPosition: 'Movimento circular sobre o peito',
    trajectoryDescription: 'Trajetória circular contínua no plano frontal sobre o tórax',
    movementType: 'circular_chest',
    facialExpressionLabel: 'Expressão positiva / sorriso suave',
    expectedNmf: ['positive_smile', 'neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['chest'],
    handshapeProfile: {
      thumb: [0.3, 1.0],
      index: [0.68, 1.0],
      middle: [0.68, 1.0],
      ring: [0.68, 1.0],
      pinky: [0.68, 1.0]
    },
    allowedPalmFacings: ['signer', 'inward'],
    requiresMotion: true,
    minConfidence: 0.80,
    dtwTrajectoryTemplate: [
      { x: 0, y: -0.08, z: 0 },
      { x: 0.08, y: 0, z: 0 },
      { x: 0, y: 0.08, z: 0 },
      { x: -0.08, y: 0, z: 0 }
    ],
    validationStatus: 'validated',
    validationNotes: 'Exige palma voltada para o peito, localização sobre o tórax E movimento circular detectado pelo varrimento angular.',
    linguisticSource: {
      name: 'INES / SignBank Libras (UFSC)',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=gostar',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=gostar',
      notes: 'Verbo de sentimento com PA no tórax.'
    }
  },
  {
    id: 'saber',
    name: 'Saber / Conhecer',
    gloss: 'SABER',
    portugueseTranslations: ['Saber', 'Conhecer'],
    category: 'Cognição',
    icon: '💡',
    description: 'Dedo indicador ou mão tocando suavemente a lateral da testa (têmpora).',
    handshapeName: "Configuração em '1' / 'D' tocando a têmpora",
    palmOrientationLabel: 'Palma voltada para a têmpora',
    articulationLocationLabel: 'Têmpora / lateral da testa',
    initialPosition: 'Têmpora',
    finalPosition: 'Toque na lateral da testa',
    trajectoryDescription: 'Articulação estática ou pequeno toque repetido na têmpora',
    movementType: 'static',
    facialExpressionLabel: 'Neutra / afirmativa',
    expectedNmf: ['neutral', 'affirmative_nod', 'any'],
    twoHanded: 1,
    referencePoints: ['temple', 'forehead'],
    handshapeProfile: {
      thumb: [0.0, 0.75],
      index: [0.68, 1.0],
      middle: [0.0, 0.45],
      ring: [0.0, 0.45],
      pinky: [0.0, 0.45]
    },
    allowedPalmFacings: ['inward', 'signer', 'camera'],
    requiresMotion: false,
    minConfidence: 0.78,
    validationStatus: 'validated',
    validationNotes: 'Localização estritamente ancorada à têmpora/testa usando Pose + Face landmarks normalizados.',
    linguisticSource: {
      name: 'SignBank Libras (UFSC) / INES',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=saber',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=saber',
      notes: 'Verbo cognitivo articulado na têmpora.'
    }
  },
  {
    id: 'aprender',
    name: 'Aprender',
    gloss: 'APRENDER',
    portugueseTranslations: ['Aprender', 'Estudar/Absorver'],
    category: 'Ações',
    icon: '🧠',
    description: 'Mão aberta em frente à testa fechando os dedos em sequência como quem captura o conhecimento.',
    handshapeName: "Transição de mão aberta '5' fechando para 'S'/'A'",
    palmOrientationLabel: 'Palma voltada para a testa',
    articulationLocationLabel: 'Testa',
    initialPosition: 'Mão aberta à frente da testa',
    finalPosition: 'Mão fechando junto à testa',
    trajectoryDescription: 'Fechamento dos dedos na altura da testa',
    movementType: 'closing_grasp',
    facialExpressionLabel: 'Concentração',
    expectedNmf: ['neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['forehead', 'temple'],
    handshapeProfile: {
      thumb: [0.0, 0.9],
      index: [0.0, 0.85],
      middle: [0.0, 0.85],
      ring: [0.0, 0.85],
      pinky: [0.0, 0.85]
    },
    allowedPalmFacings: ['signer', 'inward', 'camera'],
    requiresMotion: true,
    minConfidence: 0.79,
    validationStatus: 'validated',
    validationNotes: 'Exige transição temporal de fechamento dos dedos (opennessDelta < -0.18) na região da testa.',
    linguisticSource: {
      name: 'INES / SignBank Libras (UFSC)',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=aprender',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=aprender',
      notes: 'Verbo cognitivo com mudança de configuração de mão.'
    }
  },
  {
    id: 'surdo',
    name: 'Surdo(a)',
    gloss: 'SURDO',
    portugueseTranslations: ['Surdo(a)', 'Pessoa Surda'],
    category: 'Identidade',
    icon: '🧏',
    description: 'Dedo indicador tocando a orelha e deslocando-se em arco curto até tocar a lateral da boca.',
    handshapeName: "Configuração em '1' / 'D'",
    palmOrientationLabel: 'Palma voltada para o rosto/medial',
    articulationLocationLabel: 'Orelha -> Boca',
    initialPosition: 'Orelha / lateral da cabeça',
    finalPosition: 'Lateral da boca / queixo',
    trajectoryDescription: 'Trajetória descendente-medial da orelha até a boca',
    movementType: 'ear_to_mouth',
    facialExpressionLabel: 'Neutra / afirmativa',
    expectedNmf: ['neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['ear', 'temple', 'nose_mouth', 'chin'],
    handshapeProfile: {
      thumb: [0.0, 0.7],
      index: [0.7, 1.0],
      middle: [0.0, 0.35],
      ring: [0.0, 0.35],
      pinky: [0.0, 0.35]
    },
    allowedPalmFacings: ['inward', 'signer', 'camera'],
    requiresMotion: true,
    minConfidence: 0.80,
    dtwTrajectoryTemplate: [
      { x: 0.32, y: -0.25, z: 0.0 },
      { x: 0.2, y: -0.15, z: -0.05 },
      { x: 0.06, y: -0.08, z: -0.08 }
    ],
    validationStatus: 'validated',
    validationNotes: 'Exige indicador estendido com trajetória temporal verificada entre a orelha/têmpora e a boca.',
    linguisticSource: {
      name: 'INES / Corpus de Libras UFSC',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=surdo',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=surdo',
      notes: 'Sinal identitário da Comunidade Surda.'
    }
  },
  // =========================================================================
  // SINAIS PENDENTES DE VALIDAÇÃO (Requerem modelo sequencial/dataset vídeo)
  // =========================================================================
  {
    id: 'desculpa',
    name: 'Desculpa',
    gloss: 'DESCULPA',
    portugueseTranslations: ['Desculpa', 'Perdão'],
    category: 'Cortesia',
    icon: '🙇',
    description: 'Mão em configuração Y (polegar e mínimo estendidos) passando suavemente sob o queixo.',
    handshapeName: "Configuração em 'Y' (polegar e mínimo estendidos)",
    palmOrientationLabel: 'Palma voltada para dentro / cima',
    articulationLocationLabel: 'Queixo',
    initialPosition: 'Sob o queixo',
    finalPosition: 'Movimento curto sob o queixo',
    trajectoryDescription: 'Fricção/toque suave sob o queixo em configuração Y',
    movementType: 'static',
    facialExpressionLabel: 'Expressão de arrependimento',
    expectedNmf: ['neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['chin'],
    handshapeProfile: {
      thumb: [0.6, 1.0],
      index: [0.0, 0.35],
      middle: [0.0, 0.35],
      ring: [0.0, 0.35],
      pinky: [0.6, 1.0]
    },
    allowedPalmFacings: ['signer', 'up', 'inward'],
    requiresMotion: false,
    minConfidence: 0.85,
    validationStatus: 'pending_validation',
    validationNotes: 'Pendente de validação: contato sob o queixo sofre oclusão parcial de câmera 2D e variações regionais.',
    linguisticSource: {
      name: 'INES / Spread the Sign (PT-BR)',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=desculpa',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=desculpa',
      notes: 'Consulte o vídeo de referência externa.'
    }
  },
  {
    id: 'bom_dia',
    name: 'Bom Dia',
    gloss: 'BOM_DIA',
    portugueseTranslations: ['Bom dia'],
    category: 'Saudações',
    icon: '🌅',
    description: 'Sinal composto: BOM (mão saindo da boca abrindo para frente) seguido de DIA (letra D girando da têmpora).',
    handshapeName: "Composto: Mão fechada -> aberta (BOM) + Letra 'D' (DIA)",
    palmOrientationLabel: 'Palma para dentro -> frente',
    articulationLocationLabel: 'Boca -> Têmpora / espaço neutro',
    initialPosition: 'Boca',
    finalPosition: 'Arco frontal em D',
    trajectoryDescription: 'Sequência bifásica composta (BOM + DIA)',
    movementType: 'forward_away',
    facialExpressionLabel: 'Sorriso acolhedor',
    expectedNmf: ['positive_smile', 'neutral', 'any'],
    twoHanded: 1,
    referencePoints: ['nose_mouth', 'temple', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.2, 0.9],
      index: [0.5, 1.0],
      middle: [0.0, 0.5],
      ring: [0.0, 0.5],
      pinky: [0.0, 0.5]
    },
    allowedPalmFacings: ['any'],
    requiresMotion: true,
    minConfidence: 0.85,
    validationStatus: 'pending_validation',
    validationNotes: 'Pendente de validação: sinal composto de dois morfemas sequenciais (BOM + DIA); recomenda-se modelo temporal treinado em vídeo.',
    linguisticSource: {
      name: 'INES / SignBank Libras (UFSC)',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=bom+dia',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=bom+dia',
      notes: 'Sinal composto por BOM + DIA.'
    }
  },
  {
    id: 'boa_noite',
    name: 'Boa Noite',
    gloss: 'BOA_NOITE',
    portugueseTranslations: ['Boa noite'],
    category: 'Saudações',
    icon: '🌙',
    description: 'Sinal composto: BOM (mão na boca) seguido de NOITE (mão em concha cobrindo o dorso da outra mão).',
    handshapeName: 'Composto: BOM + mão em concha sobre o dorso da outra',
    palmOrientationLabel: 'Palma para baixo',
    articulationLocationLabel: 'Boca -> Espaço neutro',
    initialPosition: 'Boca',
    finalPosition: 'Uma mão sobre a outra no espaço neutro',
    trajectoryDescription: 'Sequência bifásica composta (BOM + NOITE)',
    movementType: 'two_hand_contact',
    facialExpressionLabel: 'Tranquila',
    expectedNmf: ['neutral', 'positive_smile', 'any'],
    twoHanded: 2,
    referencePoints: ['nose_mouth', 'chest', 'neutral_space'],
    handshapeProfile: {
      thumb: [0.2, 1.0],
      index: [0.5, 1.0],
      middle: [0.5, 1.0],
      ring: [0.5, 1.0],
      pinky: [0.5, 1.0]
    },
    allowedPalmFacings: ['down', 'any'],
    requiresMotion: true,
    minConfidence: 0.85,
    validationStatus: 'pending_validation',
    validationNotes: 'Pendente de validação: sinal composto bifásico (BOM + NOITE) com transição de 1 para 2 mãos.',
    linguisticSource: {
      name: 'INES / SignBank Libras (UFSC)',
      url: 'https://www.spreadthesign.com/pt.br/search/?q=boa+noite',
      verified: true
    },
    videoReference: {
      sourceName: 'Spread the Sign (PT-BR)',
      externalUrl: 'https://www.spreadthesign.com/pt.br/search/?q=boa+noite',
      notes: 'Sinal composto por BOM + NOITE.'
    }
  }
];
