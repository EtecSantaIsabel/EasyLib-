import { 
  LibrasTrackInfo, 
  Section, 
  Unit,
  PathNode,
  Exercise,
  SignData, 
  Quest, 
  Achievement, 
  DuoOutfit,
  LeaderboardUser,
  MatchPair
} from '../types';

export const LIBRAS_TRACKS: LibrasTrackInfo[] = [
  {
    id: 'iniciante',
    title: 'Libras Iniciante: Fundamentos & Alfabeto',
    subtitle: 'Datilologia, Saudações, Parâmetros e Primeiros Sinais',
    badge: '🤟',
    totalUnits: 15
  },
  {
    id: 'intermediario',
    title: 'Libras Intermediário: Família, Verbos & Dia a Dia',
    subtitle: 'Pronomes, Relações, Verbos Direcionais e Alimentação',
    badge: '🌟',
    totalUnits: 15
  },
  {
    id: 'avancado',
    title: 'Libras Fluência: Sintaxe & Espaço Gramatical',
    subtitle: 'Estrutura Tópico-Comentário, Classificadores e Diálogos',
    badge: '🏆',
    totalUnits: 10
  },
  {
    id: 'gramatica_nmf',
    title: 'Expressões Não-Manuais (NMF) & Cultura Surda',
    subtitle: 'Movimento Facial, Sobrancelhas, Identidade e História Surda',
    badge: '🎭',
    totalUnits: 10
  }
];

export const LIBRAS_DICTIONARY: SignData[] = [
  {
    id: 'sign_oi',
    name: 'Oi / Olá',
    category: 'Saudações',
    meaning: 'Cumprimento informal padrão em Libras.',
    handshapeName: "Mão em 'O' seguido de 'I'",
    handshapeIcon: '👋',
    bodyLocation: 'Espaço neutro à frente do ombro',
    movementType: 'Movimento circular suave do dedo mindinho ou movimento de abano',
    facialExpression: 'Expressão amigável e sorriso natural',
    description: 'Faça a configuração da letra O e estenda o dedo mínimo (I), fazendo um pequeno movimento circular ou aceno.',
    visualGlyph: '👋',
    svgPathType: 'hand_i'
  },
  {
    id: 'sign_tudo_bem',
    name: 'Tudo Bem?',
    category: 'Saudações',
    meaning: 'Pergunta ou confirmação sobre o estado da pessoa.',
    handshapeName: "Sinal de BOM + sinal de POSITIVO 👍",
    handshapeIcon: '👍',
    bodyLocation: 'Boca / Queixo -> Espaço neutro',
    movementType: 'Tocar a boca com a mão fechada, abrir em frente ao peito e levantar o polegar',
    facialExpression: 'Interrogativa: sobrancelhas levantadas e cabeça levemente inclinada',
    description: 'Com a mão em frente à boca, abra a mão para frente e finalize com a mão em joinha.',
    visualGlyph: '👍',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_bom_dia',
    name: 'Bom Dia',
    category: 'Saudações',
    meaning: 'Saudação matinal.',
    handshapeName: "Sinal de BOM + sinal de DIA",
    handshapeIcon: '🌅',
    bodyLocation: 'Boca -> Têmpora / Espaço neutro',
    movementType: 'Mão na boca abrindo para frente, depois letra D partindo da têmpora em semicírculo',
    facialExpression: 'Sorriso acolhedor',
    description: 'Sinalize BOM (mão na boca abrindo) e depois a letra D girando como o sol nascendo.',
    visualGlyph: '🌅',
    svgPathType: 'hand_pointing'
  },
  {
    id: 'sign_boa_tarde',
    name: 'Boa Tarde',
    category: 'Saudações',
    meaning: 'Saudação vespertina.',
    handshapeName: "BOM + braço estendido com a mão descendo como o pôr do sol",
    handshapeIcon: '☀️',
    bodyLocation: 'Boca -> Antebraço',
    movementType: 'Mão fechada na boca abrindo para frente e mão descendo pelo braço',
    facialExpression: 'Simpática',
    description: 'Faça BOM e depois desça a mão aberta sobre o antebraço oposto.',
    visualGlyph: '☀️',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_boa_noite',
    name: 'Boa Noite',
    category: 'Saudações',
    meaning: 'Saudação noturna.',
    handshapeName: "BOM + mão cobrindo a outra mão como a noite caindo",
    handshapeIcon: '🌙',
    bodyLocation: 'Boca -> Espaço Neutro',
    movementType: 'BOM seguido de uma mão aberta em concha cobrindo o dorso da outra mão',
    facialExpression: 'Tranquila',
    description: 'Faça BOM e cubra suavemente uma mão com a outra em concha.',
    visualGlyph: '🌙',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_obrigado',
    name: 'Obrigado(a)',
    category: 'Cortesia',
    meaning: 'Expressão de agradecimento e gratidão.',
    handshapeName: "Mão aberta em 'B' ou espalmada na testa e no peito",
    handshapeIcon: '🙏',
    bodyLocation: 'Testa e Peito',
    movementType: 'Uma mão toca a testa e a outra o peito, projetando-se suavemente para frente',
    facialExpression: 'Expressão de gratidão sincera com leve inclinação de cabeça',
    description: 'Toque a testa com a ponta dos dedos de uma mão e o peito com a outra, inclinando levemente o tronco.',
    visualGlyph: '🙏',
    svgPathType: 'hand_b'
  },
  {
    id: 'sign_por_favor',
    name: 'Por Favor / Com Licença',
    category: 'Cortesia',
    meaning: 'Pedido educado de passagem, permissão ou favor.',
    handshapeName: "Mãos abertas espalmadas unidas pelas palmas ou deslizando",
    handshapeIcon: '🤲',
    bodyLocation: 'Espaço neutro em frente ao peito',
    movementType: 'Palmas unidas ou uma palma deslizando para trás sobre a outra',
    facialExpression: 'Expressão humilde e cortês',
    description: 'Una as palmas das mãos em frente ao peito ou passe a palma sobre a outra puxando para si.',
    visualGlyph: '🤲',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_meu_nome',
    name: 'Meu Nome',
    category: 'Apresentação',
    meaning: 'Indicar o nome próprio ou perguntar o nome de alguém.',
    handshapeName: "Mão em 'U' / 'N' (indicador e médio juntos estendidos)",
    handshapeIcon: '🏷️',
    bodyLocation: 'Espaço neutro na altura do peito',
    movementType: 'Passar a mão em U na horizontal de um lado para o outro na frente do peito',
    facialExpression: 'Neutra ao afirmar; sobrancelhas erguidas ao perguntar',
    description: 'Com os dedos indicador e médio juntos em U, deslize a mão de lado em frente ao peito.',
    visualGlyph: '🏷️',
    svgPathType: 'hand_pointing'
  },
  {
    id: 'sign_sinal_batismo',
    name: 'Sinal Próprio (Batismo)',
    category: 'Cultura Surda',
    meaning: 'Identidade visual única dada pela comunidade surda.',
    handshapeName: "Configuração específica do sinal atribuído",
    handshapeIcon: '✨',
    bodyLocation: 'Ponto do corpo característico (rosto, cabelo, peito)',
    movementType: 'Movimento característico do sinal de batismo',
    facialExpression: 'Orgulho e respeito',
    description: 'O sinal de batismo é a identidade oficial da pessoa na comunidade surda.',
    visualGlyph: '✨',
    svgPathType: 'hand_ily'
  },
  {
    id: 'sign_surdo',
    name: 'Surdo(a)',
    category: 'Identidade',
    meaning: 'Pessoa surda com identidade linguística e cultural visual.',
    handshapeName: "Mão em '1' ou 'D' (dedo indicador apontado)",
    handshapeIcon: '🧏',
    bodyLocation: 'Ouvido -> Boca',
    movementType: 'Tocar a orelha e em seguida a boca com o dedo indicador',
    facialExpression: 'Neutra e afirmativa',
    description: 'Toque o ouvido com a ponta do indicador e em seguida encoste na boca.',
    visualGlyph: '🧏',
    svgPathType: 'hand_pointing'
  },
  {
    id: 'sign_ouvinte',
    name: 'Ouvinte',
    category: 'Identidade',
    meaning: 'Pessoa que ouve e usa a modalidade oral-auditiva.',
    handshapeName: "Mão aberta perto da orelha fazendo movimento de onda sonora",
    handshapeIcon: '👂',
    bodyLocation: 'Ao lado da orelha',
    movementType: 'Dedo indicador desenha pequenos semicírculos saindo da orelha',
    facialExpression: 'Neutra',
    description: 'Coloque o indicador próximo à orelha e faça pequenos círculos para fora.',
    visualGlyph: '👂',
    svgPathType: 'hand_pointing'
  },
  {
    id: 'sign_aprender',
    name: 'Aprender',
    category: 'Educação',
    meaning: 'Adquirir conhecimento, estudar, absorver aprendizado.',
    handshapeName: "Mão aberta fechando em punho na testa",
    handshapeIcon: '🧠',
    bodyLocation: 'Testa (Altura Superior)',
    movementType: 'Mão aberta em frente à testa fecha-se rapidamente em punho tocando a mente',
    facialExpression: 'Atenção e interesse',
    description: 'Abra a mão em frente à testa e feche os dedos como se estivesse pegando uma ideia e guardando na mente.',
    visualGlyph: '🧠',
    svgPathType: 'hand_fist'
  },
  {
    id: 'sign_saber',
    name: 'Saber / Conhecer',
    category: 'Cognição',
    meaning: 'Ter conhecimento ou domínio sobre algo.',
    handshapeName: "Mão espalmada tocando a lateral da testa",
    handshapeIcon: '💡',
    bodyLocation: 'Testa / Têmpora',
    movementType: 'Bater as pontas dos dedos suavemente na têmpora 2 vezes',
    facialExpression: 'Firmeza',
    description: 'Toque a têmpora com a ponta dos quatro dedos da mão aberta.',
    visualGlyph: '💡',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_nao_saber',
    name: 'Não Saber',
    category: 'Cognição',
    meaning: 'Desconhecer uma informação.',
    handshapeName: "Mão na têmpora jogando para fora",
    handshapeIcon: '🤷',
    bodyLocation: 'Testa -> Espaço Neutro',
    movementType: 'Toque a têmpora e gire a mão para fora abrindo a palma, balançando a cabeça',
    facialExpression: 'Expressão de negação e dúvida',
    description: 'Toque a têmpora e jogue a mão para fora balançando a cabeça em sinal de negação.',
    visualGlyph: '🤷',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_libras',
    name: 'Libras',
    category: 'Língua',
    meaning: 'Língua Brasileira de Sinais.',
    handshapeName: "Mãos abertas com dedos entrelaçando no ar em círculos alternados",
    handshapeIcon: '👐',
    bodyLocation: 'Espaço neutro na frente do peito',
    movementType: 'Movimento circular alternado das duas mãos sinalizando no ar',
    facialExpression: 'Entusiasmo',
    description: 'Gire as duas mãos abertas para frente de forma alternada, simulando fluência visual.',
    visualGlyph: '👐',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_casa',
    name: 'Casa / Lar',
    category: 'Lugares',
    meaning: 'Residência, lar, habitação.',
    handshapeName: "Mãos abertas em 'B' unidas pelas pontas formando um telhado",
    handshapeIcon: '🏠',
    bodyLocation: 'Espaço neutro na altura do peito',
    movementType: 'Unir as pontas dos dedos das duas mãos em ângulo de 90 graus',
    facialExpression: 'Neutra',
    description: 'Junte as pontas dos dedos das duas mãos espalmadas formando um telhado triangular.',
    visualGlyph: '🏠',
    svgPathType: 'hand_b'
  },
  {
    id: 'sign_trabalhar',
    name: 'Trabalhar',
    category: 'Ações',
    meaning: 'Exercer atividade profissional ou serviço.',
    handshapeName: "Mãos em 'L' viradas para baixo batendo alternadas",
    handshapeIcon: '💼',
    bodyLocation: 'Espaço neutro',
    movementType: 'Duas mãos em L paralelas movimentando-se para frente e para trás alternadamente',
    facialExpression: 'Foco e determinação',
    description: 'Coloque as duas mãos em L apontadas para frente e faça movimentos rítmicos alternados.',
    visualGlyph: '💼',
    svgPathType: 'hand_l'
  },
  {
    id: 'sign_ajudar',
    name: 'Ajudar',
    category: 'Verbos Direcionais',
    meaning: 'Prestar auxílio, socorro ou apoio.',
    handshapeName: "Mão em 'A' ou 'B' apoiada sobre a palma aberta e projetada na direção da pessoa",
    handshapeIcon: '🤝',
    bodyLocation: 'Espaço neutro (com concordância de direção)',
    movementType: 'Mão de apoio leva a outra mão do emissor para o receptor',
    facialExpression: 'Solidariedade',
    description: 'Apoie a mão em punho sobre a palma da outra mão e mova para frente (EU-AJUDO-VOCÊ) ou para si (VOCÊ-ME-AJUDA).',
    visualGlyph: '🤝',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_mae',
    name: 'Mãe',
    category: 'Família',
    meaning: 'Genitora feminina (Mulher + Beijo de respeito).',
    handshapeName: "Polegar deslizando no queixo + beijo no dorso da mão aberta",
    handshapeIcon: '👩',
    bodyLocation: 'Queixo -> Boca',
    movementType: 'Deslizar o polegar pela bochecha/queixo e encostar o dorso da mão na boca',
    facialExpression: 'Carinhosa',
    description: 'Passe o polegar pelo queixo e encoste o dorso da mão nos lábios com carinho.',
    visualGlyph: '👩',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_pai',
    name: 'Pai',
    category: 'Família',
    meaning: 'Genitor masculino (Homem + Beijo no dorso da mão).',
    handshapeName: "Mão em 'C' alisando a barba/bigode + beijo no dorso da mão",
    handshapeIcon: '👨',
    bodyLocation: 'Queixo -> Boca',
    movementType: 'Puxar o queixo indicando barba e encostar o dorso da mão nos lábios',
    facialExpression: 'Respeitosa',
    description: 'Sinalize homem (puxando o queixo) e encoste o dorso da mão na boca.',
    visualGlyph: '👨',
    svgPathType: 'hand_c'
  },
  {
    id: 'sign_filho',
    name: 'Filho / Filha',
    category: 'Família',
    meaning: 'Descendente.',
    handshapeName: "Mão aberta saindo do peito e fechando",
    handshapeIcon: '👶',
    bodyLocation: 'Peito -> Espaço Neutro',
    movementType: 'Puxar do peito para frente fechando a mão em concha',
    facialExpression: 'Afetuosa',
    description: 'Puxe a mão do peito para frente, indicando algo que brotou de dentro.',
    visualGlyph: '👶',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_amigo',
    name: 'Amigo(a)',
    category: 'Relações',
    meaning: 'Pessoa querida, companheiro.',
    handshapeName: "Mão aberta espalmada batendo no peito do lado esquerdo",
    handshapeIcon: '💛',
    bodyLocation: 'Peito / Coração',
    movementType: 'Bater a palma da mão no peito sobre o coração duas vezes',
    facialExpression: 'Sorriso acolhedor',
    description: 'Bata com a palma da mão no peito esquerdo sobre o coração duas vezes.',
    visualGlyph: '💛',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_gostar',
    name: 'Gostar',
    category: 'Sentimentos',
    meaning: 'Apreciar, ter apreço por algo ou alguém.',
    handshapeName: "Mão aberta espalmada fazendo círculos no peito",
    handshapeIcon: '😍',
    bodyLocation: 'Peito',
    movementType: 'Passar a palma da mão aberta em movimento circular suave no peito',
    facialExpression: 'Expressão de satisfação e prazer',
    description: 'Gire a palma da mão aberta suavemente no centro do peito.',
    visualGlyph: '😍',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_nao_gostar',
    name: 'Não Gostar',
    category: 'Sentimentos',
    meaning: 'Desgostar, rejeitar.',
    handshapeName: "Mão no peito puxando para fora e soltando",
    handshapeIcon: '😒',
    bodyLocation: 'Peito -> Espaço Neutro',
    movementType: 'Passe a mão no peito e jogue para fora abrindo os dedos, balançando a cabeça',
    facialExpression: 'Desagrado e negação',
    description: 'Passe a mão no peito e jogue para frente com cara de desagrado.',
    visualGlyph: '😒',
    svgPathType: 'hand_open'
  },
  {
    id: 'sign_desculpas',
    name: 'Desculpa / Perdão',
    category: 'Cortesia',
    meaning: 'Pedir perdão ou desculpas por um equívoco.',
    handshapeName: "Mão em 'Y' com o polegar tocando o queixo",
    handshapeIcon: '🙇',
    bodyLocation: 'Queixo',
    movementType: 'Encostar o polegar da mão em Y no queixo com leve movimento para baixo',
    facialExpression: 'Expressão de arrependimento e humildade',
    description: 'Faça a letra Y com a mão e encoste a ponta do polegar no centro do queixo.',
    visualGlyph: '🙇',
    svgPathType: 'hand_y'
  },
  {
    id: 'sign_eu_te_amo',
    name: 'Eu Te Amo (ILY)',
    category: 'Expressões',
    meaning: 'Declaração de carinho, amor e afeto universal na cultura surda.',
    handshapeName: "Mão em 'I-L-Y' (polegar, indicador e mindinho estendidos)",
    handshapeIcon: '🤟',
    bodyLocation: 'Espaço neutro na altura do peito',
    movementType: 'Mão projetada para a frente com leve balanço lateral',
    facialExpression: 'Sorriso aberto e carinhoso',
    description: 'Estenda o polegar, o dedo indicador e o dedo mínimo ao mesmo tempo com a palma para frente.',
    visualGlyph: '🤟',
    svgPathType: 'hand_ily'
  }
];

// Definition of the 50 Comprehensive Units
interface UnitDefinition {
  id: string;
  unitNumber: number;
  sectionNumber: number;
  title: string;
  description: string;
  themeColor: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow' | 'teal';
  coreSignIds: string[];
  grammarTitle: string;
  grammarExplanation: string;
  exampleGloss: string;
  examplePt: string;
  culturalTip: string;
}

const UNIT_BLUEPRINTS: UnitDefinition[] = [
  // SEÇÃO 1: FUNDAMENTOS & PRIMEIRA COMUNICAÇÃO (Unidades 1 a 5)
  {
    id: 'u1_alfabeto_saudacoes',
    unitNumber: 1,
    sectionNumber: 1,
    title: 'Alfabeto Manual & Saudações',
    description: 'Datilologia, soletração de nomes e saudações essenciais do dia a dia.',
    themeColor: 'green',
    coreSignIds: ['sign_oi', 'sign_tudo_bem', 'sign_bom_dia', 'sign_meu_nome'],
    grammarTitle: 'Datilologia & Estrutura Inicial',
    grammarExplanation: 'A datilologia é o alfabeto manual usado para soletrar nomes próprios e termos sem sinal específico.',
    exampleGloss: 'OI! MEU NOME M-A-R-C-I-O',
    examplePt: 'Oi! Meu nome é Márcio.',
    culturalTip: 'Na Cultura Surda, ao conhecer alguém, você soletra seu nome e recebe um "Sinal de Batismo" exclusivo!'
  },
  {
    id: 'u2_cortesia_cumprimentos',
    unitNumber: 2,
    sectionNumber: 1,
    title: 'Cortesia & Cumprimentos Formais',
    description: 'Obrigado, por favor, desculpe, boa tarde e boa noite.',
    themeColor: 'green',
    coreSignIds: ['sign_obrigado', 'sign_por_favor', 'sign_desculpas', 'sign_boa_tarde', 'sign_boa_noite'],
    grammarTitle: 'Sinais Compostos em Saudações',
    grammarExplanation: 'Sinais como BOA-TARDE e BOM-DIA combinam o sinal base BOM com a representação visual do sol e do tempo.',
    exampleGloss: 'POR-FAVOR, DESCULPA!',
    examplePt: 'Por favor, me desculpe!',
    culturalTip: 'O contato visual contínuo é uma regra de etiqueta fundamental e sinal de respeito na comunidade surda.'
  },
  {
    id: 'u3_apresentacao_pronomes',
    unitNumber: 3,
    sectionNumber: 1,
    title: 'Apresentação Pessoal & Pronomes',
    description: 'Eu, você, ele/ela, nós, vocês e identificação pessoal.',
    themeColor: 'green',
    coreSignIds: ['sign_meu_nome', 'sign_surdo', 'sign_ouvinte', 'sign_libras'],
    grammarTitle: 'Espacialização dos Pronomes',
    grammarExplanation: 'Em Libras, apontar não é falta de educação! O apontamento indica pronomes no espaço tridimensional.',
    exampleGloss: 'EU SURDO, VOCE OUVINTE',
    examplePt: 'Eu sou surdo e você é ouvinte.',
    culturalTip: 'Os termos corretos são "Surdo" e "Ouvinte". O termo "surdo-mudo" é incorreto e ultrapassado.'
  },
  {
    id: 'u4_familia_parentesco',
    unitNumber: 4,
    sectionNumber: 1,
    title: 'Família & Relações de Parentesco',
    description: 'Mãe, pai, filho, irmão, avô, avó e laços familiares.',
    themeColor: 'green',
    coreSignIds: ['sign_mae', 'sign_pai', 'sign_filho', 'sign_amigo'],
    grammarTitle: 'Marcadores de Gênero em Libras',
    grammarExplanation: 'Os sinais de gênero geralmente usam os marcadores MULHER (queixo) e HOMEM (barba) antes da raiz.',
    exampleGloss: 'MINHA MAE LIBRAS SABER',
    examplePt: 'Minha mãe sabe Libras.',
    culturalTip: 'A família surda valoriza o aprendizado da Libras por todos os parentes ouvintes para uma inclusão real em casa.'
  },
  {
    id: 'u5_sentimentos_emocoes',
    unitNumber: 5,
    sectionNumber: 1,
    title: 'Sentimentos, Emoções & Expressão',
    description: 'Gostar, amar, feliz, triste, saudade e raiva com NMF.',
    themeColor: 'green',
    coreSignIds: ['sign_gostar', 'sign_nao_gostar', 'sign_eu_te_amo', 'sign_amigo'],
    grammarTitle: 'Expressões Não-Manuais (NMF) Emotivas',
    grammarExplanation: 'O rosto reflete a intensidade do sentimento. Sinalizar FELIZ com o rosto sério muda o sentido.',
    exampleGloss: 'EU VOCE AMAR MUITO',
    examplePt: 'Eu amo muito você.',
    culturalTip: 'O sinal de ILY (I Love You 🤟) une as letras I, L e Y, sendo um símbolo universal de carinho na cultura surda.'
  },

  // SEÇÃO 2: COTIDIANO & AMBIENTES (Unidades 6 a 10)
  {
    id: 'u6_cores_formas',
    unitNumber: 6,
    sectionNumber: 2,
    title: 'Cores & Percepção Visual',
    description: 'Azul, vermelho, amarelo, verde, preto, branco e claro/escuro.',
    themeColor: 'blue',
    coreSignIds: ['sign_aprender', 'sign_saber', 'sign_casa'],
    grammarTitle: 'Classificadores Descritivos de Cores',
    grammarExplanation: 'As cores em Libras possuem referências icônicas (ex: vermelho no lábio, amarelo no cabelo).',
    exampleGloss: 'MINHA CASA COR AZUL CLARO',
    examplePt: 'Minha casa é azul clara.',
    culturalTip: 'A percepção visual das pessoas surdas é altamente apurada para contrastes de cores e iluminação.'
  },
  {
    id: 'u7_alimentos_bebidas',
    unitNumber: 7,
    sectionNumber: 2,
    title: 'Alimentos, Bebidas & Refeições',
    description: 'Comer, beber, água, café, arroz, feijão, pão e frutas.',
    themeColor: 'blue',
    coreSignIds: ['sign_aprender', 'sign_gostar', 'sign_nao_gostar'],
    grammarTitle: 'Ponto de Articulação Oral',
    grammarExplanation: 'A grande maioria dos sinais de alimentação é articulada próxima à boca e ao queixo.',
    exampleGloss: 'EU COMER ARROZ FEIJÃO GOSTAR',
    examplePt: 'Eu gosto de comer arroz com feijão.',
    culturalTip: 'Em refeições comunitárias surdas, a mesa redonda é preferida para que todos possam se ver e conversar.'
  },
  {
    id: 'u8_calendario_dias',
    unitNumber: 8,
    sectionNumber: 2,
    title: 'Dias da Semana & Calendário',
    description: 'Segunda a domingo, ontem, hoje, amanhã, mês e ano.',
    themeColor: 'blue',
    coreSignIds: ['sign_bom_dia', 'sign_boa_tarde', 'sign_boa_noite'],
    grammarTitle: 'Linha do Tempo em Libras',
    grammarExplanation: 'O espaço atrás do corpo indica PASSADO; o corpo indica PRESENTE; à frente indica FUTURO.',
    exampleGloss: 'AMANHA EU LIBRAS ESTUDAR',
    examplePt: 'Amanhã eu vou estudar Libras.',
    culturalTip: 'A pontualidade visual é fundamental em reuniões com intérpretes e eventos da comunidade.'
  },
  {
    id: 'u9_numeros_quantificadores',
    unitNumber: 9,
    sectionNumber: 2,
    title: 'Números Cardinais & Quantidades',
    description: 'Números 0 a 100, numerais ordinais, valores monetários e quantidade.',
    themeColor: 'blue',
    coreSignIds: ['sign_aprender', 'sign_saber', 'sign_meu_nome'],
    grammarTitle: 'Variações dos Números em Libras',
    grammarExplanation: 'Libras possui 3 formas para números: Cardinais, Quantitativos e Ordinais (com movimento oscilante).',
    exampleGloss: 'EU TER 2 IRMAO',
    examplePt: 'Eu tenho dois irmãos.',
    culturalTip: 'Alguns números (como 1, 2, 4) mudam de configuração quando contam objetos versus quando dizem número de telefone.'
  },
  {
    id: 'u10_casa_objetos',
    unitNumber: 10,
    sectionNumber: 2,
    title: 'Casa, Móveis & Objetos',
    description: 'Sala, quarto, cozinha, mesa, cama, porta, janela e eletrodomésticos.',
    themeColor: 'blue',
    coreSignIds: ['sign_casa', 'sign_trabalhar', 'sign_aprender'],
    grammarTitle: 'Disposição Espacial na Casa',
    grammarExplanation: 'Ao descrever uma casa em Libras, você monta um mapa visual 3D em frente ao seu corpo.',
    exampleGloss: 'MINHA CASA COZINHA GRANDE',
    examplePt: 'Minha casa tem uma cozinha grande.',
    culturalTip: 'Casas de pessoas surdas costumam ter campainhas com lâmpadas piscantes para avisar visitas.'
  },

  // SEÇÃO 3: VERBOS, AÇÕES & TRABALHO (Unidades 11 a 15)
  {
    id: 'u11_verbos_cotidiano',
    unitNumber: 11,
    sectionNumber: 3,
    title: 'Verbos Cotidianos Sem Direção',
    description: 'Comer, dormir, acordar, andar, correr, brincar e descansar.',
    themeColor: 'purple',
    coreSignIds: ['sign_trabalhar', 'sign_aprender', 'sign_saber'],
    grammarTitle: 'Verbos Não-Direcionais',
    grammarExplanation: 'Verbos como DORMIR e COMER não se movem em direção ao objeto da frase.',
    exampleGloss: 'HOJE EU MUITO TRABALHAR DORMIR TARDE',
    examplePt: 'Hoje trabalhei muito e vou dormir tarde.',
    culturalTip: 'A expressão corporal dá o ritmo do verbo (rápido, lento, exaustivo).'
  },
  {
    id: 'u12_verbos_direcionais',
    unitNumber: 12,
    sectionNumber: 3,
    title: 'Verbos Direcionais & Concordância',
    description: 'Ajudar, avisar, ensinar, perguntar, responder e entregar.',
    themeColor: 'purple',
    coreSignIds: ['sign_ajudar', 'sign_aprender', 'sign_saber'],
    grammarTitle: 'Concordância Direcional no Espaço',
    grammarExplanation: 'O movimento do verbo parte do sujeito e termina no receptor (EU-AJUDO-VOCÊ ou VOCÊ-ME-AJUDA).',
    exampleGloss: 'VOCE ME-AJUDAR POR-FAVOR?',
    examplePt: 'Você pode me ajudar, por favor?',
    culturalTip: 'Os verbos direcionais eliminam a necessidade de falar os pronomes separadamente!'
  },
  {
    id: 'u13_profissoes_trabalho',
    unitNumber: 13,
    sectionNumber: 3,
    title: 'Profissões & Mercado de Trabalho',
    description: 'Professor, médico, advogado, engenheiro, intérprete TILS e programador.',
    themeColor: 'purple',
    coreSignIds: ['sign_trabalhar', 'sign_aprender', 'sign_libras'],
    grammarTitle: 'Sinais Profissionais e Raiz de Ação',
    grammarExplanation: 'Muitas profissões usam o sinal da ação + PESSOA (ex: ENSINAR + PESSOA = Professor).',
    exampleGloss: 'MEU AMIGO PROFESSOR LIBRAS',
    examplePt: 'Meu amigo é professor de Libras.',
    culturalTip: 'A Lei Brasileira de Inclusão garante cotas e acessibilidade comunicacional em empresas.'
  },
  {
    id: 'u14_locomocao_transportes',
    unitNumber: 14,
    sectionNumber: 3,
    title: 'Meios de Transporte & Viagens',
    description: 'Carro, ônibus, metrô, avião, bicicleta, a pé e viajar.',
    themeColor: 'purple',
    coreSignIds: ['sign_casa', 'sign_trabalhar', 'sign_aprender'],
    grammarTitle: 'Classificadores de Veículos (VCL)',
    grammarExplanation: 'Mão em 3 horizontal representa carro; mão em Y representa avião voando pelo espaço.',
    exampleGloss: 'AMANHA EU VIAJAR AVIAO',
    examplePt: 'Amanhã vou viajar de avião.',
    culturalTip: 'Em aeroportos, painéis visuais acessíveis são cruciais para passageiros surdos.'
  },
  {
    id: 'u15_lugares_cidade',
    unitNumber: 15,
    sectionNumber: 3,
    title: 'Lugares da Cidade & Direções',
    description: 'Escola, hospital, banco, farmácia, supermercado, parque e shopping.',
    themeColor: 'purple',
    coreSignIds: ['sign_casa', 'sign_trabalhar', 'sign_aprender'],
    grammarTitle: 'Pontos de Referência Topográficos',
    grammarExplanation: 'Em Libras, indica-se primeiro o ponto de referência maior e depois o local exato.',
    exampleGloss: 'HOSPITAL PERTO MINHA CASA',
    examplePt: 'O hospital fica perto da minha casa.',
    culturalTip: 'Sinalizadores sempre orientam o espaço pelo ponto de vista visual compartilhado.'
  },

  // SEÇÃO 4: EDUCAÇÃO, SAÚDE & BEM-ESTAR (Unidades 16 a 20)
  {
    id: 'u16_escola_universidade',
    unitNumber: 16,
    sectionNumber: 4,
    title: 'Educação, Escola & Estudos',
    description: 'Caderno, livro, prova, estudar, passar, reprovar e formatura.',
    themeColor: 'orange',
    coreSignIds: ['sign_aprender', 'sign_saber', 'sign_nao_saber'],
    grammarTitle: 'Intensificadores de Estudo',
    grammarExplanation: 'O movimento repetido com expressão concentrada indica dedicação intensa aos estudos.',
    exampleGloss: 'EU LIBRAS ESTUDAR MUITO PASSAR PROVA',
    examplePt: 'Eu estudei muito Libras e passei na prova.',
    culturalTip: 'O bilinguismo na educação de surdos prevê Libras como L1 (primeira língua) e Português escrito como L2.'
  },
  {
    id: 'u17_corpo_saude',
    unitNumber: 17,
    sectionNumber: 4,
    title: 'Corpo Humano & Sintomas Médicos',
    description: 'Cabeça, olhos, ouvido, coração, dor, febre, tosse e remédio.',
    themeColor: 'orange',
    coreSignIds: ['sign_aprender', 'sign_gostar', 'sign_nao_gostar'],
    grammarTitle: 'Localização de Dores no Próprio Corpo',
    grammarExplanation: 'O sinal de DOR (mão em F girando ou balançando) é executado exatamente onde dói no corpo.',
    exampleGloss: 'MINHA CABEÇA DOR MUITO',
    examplePt: 'Estou com muita dor de cabeça.',
    culturalTip: 'Em consultas médicas, a presença de intérprete TILS qualificado salva vidas e evita diagnósticos errados.'
  },
  {
    id: 'u18_hospital_emergencia',
    unitNumber: 18,
    sectionNumber: 4,
    title: 'Hospital, Emergência & Socorro',
    description: 'Ambulância, bombeiro, polícia, perigo, ajudar rápido e socorro.',
    themeColor: 'orange',
    coreSignIds: ['sign_ajudar', 'sign_desculpas', 'sign_obrigado'],
    grammarTitle: 'Expressões de Urgência',
    grammarExplanation: 'Movimentos rápidos, olhos arregalados e tensão muscular marcam a gravidade de emergências.',
    exampleGloss: 'CHAMAR AMBULANCIA RAPIDO! PESSOA CAIR',
    examplePt: 'Chame a ambulância rápido! A pessoa caiu.',
    culturalTip: 'Centrais de atendimento de emergência modernas contam com atendimento por chamada de vídeo em Libras.'
  },
  {
    id: 'u19_higiene_cuidados',
    unitNumber: 19,
    sectionNumber: 4,
    title: 'Higiene & Cuidados Pessoais',
    description: 'Banho, escovar dentes, lavar mãos, sabonete, toalha e pente.',
    themeColor: 'orange',
    coreSignIds: ['sign_casa', 'sign_aprender', 'sign_gostar'],
    grammarTitle: 'Classificadores Mímicos de Higiene',
    grammarExplanation: 'Sinais de higiene são icônicos e reproduzem a ação real do manuseio de objetos.',
    exampleGloss: 'ANTES COMER, LAVAR MAOS IMPORTANTE',
    examplePt: 'Antes de comer, é importante lavar as mãos.',
    culturalTip: 'A saúde preventiva é amplamente divulgada em campanhas de conscientização acessíveis em Libras.'
  },
  {
    id: 'u20_vestuario_moda',
    unitNumber: 20,
    sectionNumber: 4,
    title: 'Vestuário, Roupas & Acessórios',
    description: 'Camisa, calça, vestido, sapato, boné, óculos e relógio.',
    themeColor: 'orange',
    coreSignIds: ['sign_casa', 'sign_gostar', 'sign_aprender'],
    grammarTitle: 'Classificadores de Vestimenta no Corpo',
    grammarExplanation: 'Os sinais de roupas tocam ou contornam as partes do corpo onde a peça é vestida.',
    exampleGloss: 'MINHA CAMISA NOVA COR VERMELHA',
    examplePt: 'Minha camisa nova é vermelha.',
    culturalTip: 'Muitos sinais de roupas derivam da forma de calçar, vestir ou abotoar a peça.'
  },

  // SEÇÃO 5: SOCIEDADE, NATUREZA & LAZER (Unidades 21 a 25)
  {
    id: 'u21_animais_natureza',
    unitNumber: 21,
    sectionNumber: 5,
    title: 'Animais Domésticos & Silvestres',
    description: 'Cachorro, gato, pássaro, cavalo, peixe, leão e floresta.',
    themeColor: 'teal',
    coreSignIds: ['sign_gostar', 'sign_aprender', 'sign_casa'],
    grammarTitle: 'Classificadores Zoomórficos',
    grammarExplanation: 'Representam focinho, orelhas, patas e bicos dos animais através de configurações de mão anatômicas.',
    exampleGloss: 'MEU CACHORRO BRINCAR GOSTAR',
    examplePt: 'Meu cachorro gosta de brincar.',
    culturalTip: 'Animais de assistência para surdos são treinados para alertar quando a campainha ou o alarme toca!'
  },
  {
    id: 'u22_clima_natureza',
    unitNumber: 22,
    sectionNumber: 5,
    title: 'Clima, Estações & Meio Ambiente',
    description: 'Sol, chuva, frio, calor, vento, neve, praia e montanha.',
    themeColor: 'teal',
    coreSignIds: ['sign_bom_dia', 'sign_gostar', 'sign_nao_gostar'],
    grammarTitle: 'Fenômenos Meteorológicos Visuais',
    grammarExplanation: 'Chuva fraca versus tempestade é demonstrada pela velocidade e amplitude do movimento manual.',
    exampleGloss: 'HOJE CHOVER MUITO, FRIO FORTE',
    examplePt: 'Hoje está chovendo muito e fazendo muito frio.',
    culturalTip: 'Previsões do tempo acessíveis contam com tradutores TILS transmitindo as condições em tempo real.'
  },
  {
    id: 'u23_dinheiro_financas',
    unitNumber: 23,
    sectionNumber: 5,
    title: 'Dinheiro, Compras & Economia',
    description: 'Real, cartão, caro, barato, comprar, vender, pagar e desconto.',
    themeColor: 'teal',
    coreSignIds: ['sign_trabalhar', 'sign_aprender', 'sign_gostar'],
    grammarTitle: 'Incorporação de Valores Numéricos',
    grammarExplanation: 'Em Libras, valores de 1 a 9 reais são incorporados diretamente na configuração de mão.',
    exampleGloss: 'ESSE LIVRO CUSTAR 20 REAIS, BARATO!',
    examplePt: 'Esse livro custa 20 reais, está barato!',
    culturalTip: 'O acesso a serviços bancários inclusivos é direito garantido por lei para a comunidade surda.'
  },
  {
    id: 'u24_esportes_lazer',
    unitNumber: 24,
    sectionNumber: 5,
    title: 'Esportes, Lazer & Jogos',
    description: 'Futebol, vôlei, natação, corrida, videogame, cinema e dança.',
    themeColor: 'teal',
    coreSignIds: ['sign_amigo', 'sign_gostar', 'sign_aprender'],
    grammarTitle: 'Classificadores Dinâmicos de Esporte',
    grammarExplanation: 'Os sinais reproduzem o chute, a cortada, a braçada na piscina e a corrida no espaço.',
    exampleGloss: 'DOMINGO EU JOGAR FUTEBOL AMIGOS',
    examplePt: 'No domingo eu vou jogar futebol com meus amigos.',
    culturalTip: 'Existem as Surdolimpíadas (Deaflympics), onde os árbitros usam bandeiras e luzes no lugar de apitos!'
  },
  {
    id: 'u25_musica_teatro_surdo',
    unitNumber: 25,
    sectionNumber: 5,
    title: 'Arte, Teatro Surdo & Poesia Visual',
    description: 'Música visual, vibração, poesia em Libras, teatro e ritmo.',
    themeColor: 'teal',
    coreSignIds: ['sign_libras', 'sign_aprender', 'sign_eu_te_amo'],
    grammarTitle: 'Poesia em Libras (Visual Vernacular)',
    grammarExplanation: 'A poesia em Libras utiliza rimas manuais (mesma CM ou mesmo movimento) e ritmo visual extraordinário.',
    exampleGloss: 'POESIA LIBRAS EMOCIONAR MUITO LINDA',
    examplePt: 'A poesia em Libras é muito emocionante e linda.',
    culturalTip: 'Pessoas surdas sentem o ritmo e as batidas da música através da vibração corporal nos graves.'
  },

  // SEÇÃO 6: TECNOLOGIA, MÍDIA & MUNDO DIGITAL (Unidades 26 a 30)
  {
    id: 'u26_tecnologia_internet',
    unitNumber: 26,
    sectionNumber: 6,
    title: 'Tecnologia, Celular & Redes Sociais',
    description: 'Internet, celular, computador, WhatsApp, vídeo, mensagem e aplicativo.',
    themeColor: 'yellow',
    coreSignIds: ['sign_aprender', 'sign_trabalhar', 'sign_libras'],
    grammarTitle: 'Evolução Lexical Tecnológica',
    grammarExplanation: 'Novos sinais de tecnologia surgem rapidamente e são adotados pela comunidade através de vídeos virais.',
    exampleGloss: 'VOCE ME ENVIAR VIDEO WHATSAPP',
    examplePt: 'Você me envia o vídeo pelo WhatsApp.',
    culturalTip: 'As chamadas de vídeo revolucionaram a vida das pessoas surdas no mundo inteiro!'
  },
  {
    id: 'u27_comunicacao_visual_midia',
    unitNumber: 27,
    sectionNumber: 6,
    title: 'Comunicação Visual & Mídias',
    description: 'Notícia, televisão, legenda, acessibilidade, foto e transmissão ao vivo.',
    themeColor: 'yellow',
    coreSignIds: ['sign_libras', 'sign_surdo', 'sign_ouvinte'],
    grammarTitle: 'Janela de Libras & Legendas',
    grammarExplanation: 'A Janela de Libras deve ter tamanho proporcional e fundo contrastante para perfeita leitura.',
    exampleGloss: 'TELEVISAO TER JANELA LIBRAS ACESSIVEL',
    examplePt: 'A televisão tem janela de Libras acessível.',
    culturalTip: 'A presença da janela de Libras é obrigatória em pronunciamentos oficiais e debates públicos.'
  },
  {
    id: 'u28_geografia_brasil',
    unitNumber: 28,
    sectionNumber: 6,
    title: 'Geografia & Estados do Brasil',
    description: 'Brasil, São Paulo, Rio de Janeiro, Bahia, Amazonas e capitais.',
    themeColor: 'yellow',
    coreSignIds: ['sign_casa', 'sign_aprender', 'sign_libras'],
    grammarTitle: 'Sinais Toponímicos Nacionais',
    grammarExplanation: 'Os nomes dos estados em Libras trazem referências históricas e culturais de cada região brasileira.',
    exampleGloss: 'EU MORAR BRASIL ESTADO SAO-PAULO',
    examplePt: 'Eu moro no Brasil, no estado de São Paulo.',
    culturalTip: 'Cada estado possui variações linguísticas e sotaques regionais próprios na Libras!'
  },
  {
    id: 'u29_paises_mundo',
    unitNumber: 29,
    sectionNumber: 6,
    title: 'Países, Continentes & Mundo',
    description: 'Estados Unidos, França, Japão, Portugal, África e América Latina.',
    themeColor: 'yellow',
    coreSignIds: ['sign_aprender', 'sign_libras', 'sign_casa'],
    grammarTitle: 'Sinais Internacionais Autênticos',
    grammarExplanation: 'A comunidade surda adota os sinais que os próprios surdos nativos de cada país utilizam para sua nação.',
    exampleGloss: 'FUTURO EU VIAJAR JAPAO CONHECER',
    examplePt: 'No futuro vou viajar e conhecer o Japão.',
    culturalTip: 'Existe o International Sign (IS), sistema de sinais usado em conferências mundiais como a WFD.'
  },
  {
    id: 'u30_cidadania_direitos',
    unitNumber: 30,
    sectionNumber: 6,
    title: 'Cidadania, Leis & Direitos Surdos',
    description: 'Lei 10.436/2002, Decreto 5.626, igualdade, inclusão e respeito.',
    themeColor: 'yellow',
    coreSignIds: ['sign_libras', 'sign_surdo', 'sign_trabalhar'],
    grammarTitle: 'Terminologia Jurídica e Política',
    grammarExplanation: 'Sinais formais para legislação, direitos constitucionais e cidadania.',
    exampleGloss: 'LEI LIBRAS RECONHECER OFICIAL BRASIL',
    examplePt: 'A lei reconhece a Libras como meio legal de comunicação no Brasil.',
    culturalTip: 'A Lei 10.436 de 24 de abril de 2002 é o marco histórico do reconhecimento da Libras no Brasil!'
  },

  // SEÇÃO 7: OS 5 PARÂMETROS FONOLÓGICOS (Unidades 31 a 35)
  {
    id: 'u31_parametro_cm',
    unitNumber: 31,
    sectionNumber: 7,
    title: '1º Parâmetro: Configuração de Mão (CM)',
    description: 'O formato exato dos dedos e da mão durante a sinalização.',
    themeColor: 'red',
    coreSignIds: ['sign_oi', 'sign_meu_nome', 'sign_eu_te_amo', 'sign_desculpas'],
    grammarTitle: 'Pares Mínimos de CM',
    grammarExplanation: 'Alterar apenas o formato da mão muda completamente o significado da palavra (ex: APRENDER vs SÁBADO).',
    exampleGloss: 'MAO CONFIGURACAO MUDAR SIGNIFICADO MUDAR',
    examplePt: 'Mudar a configuração de mão altera o significado do sinal.',
    culturalTip: 'Existem mais de 60 configurações de mão catalogadas e catalogadas oficialmente na Libras!'
  },
  {
    id: 'u32_parametro_pa',
    unitNumber: 32,
    sectionNumber: 7,
    title: '2º Parâmetro: Ponto de Articulação (PA)',
    description: 'A altura e local do corpo onde o sinal é realizado.',
    themeColor: 'red',
    coreSignIds: ['sign_aprender', 'sign_saber', 'sign_obrigado', 'sign_casa'],
    grammarTitle: 'Zonas de Articulação Corporal',
    grammarExplanation: 'O sinal pode ser feito na cabeça, olhos, boca, peito ou no espaço neutro.',
    exampleGloss: 'SABER CABEÇA, GOSTAR PEITO, TRABALHAR ESPAÇO-NEUTRO',
    examplePt: 'Saber é na cabeça, gostar é no peito, trabalhar é no espaço neutro.',
    culturalTip: 'O nosso Estúdio de Câmera EasyLib analisa a altura do seu sinal em tempo real usando IA!'
  },
  {
    id: 'u33_parametro_movimento',
    unitNumber: 33,
    sectionNumber: 7,
    title: '3º Parâmetro: Movimento (M)',
    description: 'Direção, forma (retilíneo, circular, sinuoso) e frequência do sinal.',
    themeColor: 'red',
    coreSignIds: ['sign_libras', 'sign_trabalhar', 'sign_ajudar'],
    grammarTitle: 'Tipos de Movimento',
    grammarExplanation: 'Sinais podem ser estáticos (sem movimento) ou ter movimentos retilíneos, circulares ou helicoidais.',
    exampleGloss: 'SINAL MOVIMENTO CIRCULAR RAPIDO',
    examplePt: 'O sinal tem movimento circular rápido.',
    culturalTip: 'Sinais sem movimento exigem atenção redobrada à orientação e configuração da mão.'
  },
  {
    id: 'u34_parametro_orientacao',
    unitNumber: 34,
    sectionNumber: 7,
    title: '4º Parâmetro: Orientação da Palma (O)',
    description: 'Para onde a palma da mão está apontada (para cima, baixo, dentro, fora).',
    themeColor: 'red',
    coreSignIds: ['sign_meu_nome', 'sign_ajudar', 'sign_obrigado'],
    grammarTitle: 'Orientação Espacial da Palma',
    grammarExplanation: 'A palma virada para dentro indica relação com o emissor; para fora indica o interlocutor.',
    exampleGloss: 'PALMA DENTRO MEU, PALMA FORA SEU',
    examplePt: 'Palma para dentro indica posse minha; para fora indica posse sua.',
    culturalTip: 'A orientação correta da palma evita ambiguidades na interpretação dos sinais.'
  },
  {
    id: 'u35_parametro_nmf',
    unitNumber: 35,
    sectionNumber: 7,
    title: '5º Parâmetro: Expressões Não-Manuais (NMF)',
    description: 'Movimentos de sobrancelhas, olhos, boca e inclinação da cabeça.',
    themeColor: 'red',
    coreSignIds: ['sign_tudo_bem', 'sign_nao_gostar', 'sign_nao_saber'],
    grammarTitle: 'Gramática Facial e Prosódia',
    grammarExplanation: 'As NMF equivalem à entonação de voz nas línguas orais: diferenciam afirmação, pergunta e espanto.',
    exampleGloss: 'ROSTO EXPRESSAO MOSTRAR SENTIMENTO E PERGUNTA',
    examplePt: 'A expressão facial mostra sentimento e pergunta.',
    culturalTip: 'Sem as expressões faciais, a Libras perde sua riqueza gramatical e expressividade comunicativa.'
  },

  // SEÇÃO 8: SINTAXE, NEGAÇÃO & CLASSIFICADORES (Unidades 36 a 40)
  {
    id: 'u36_tipos_negacao',
    unitNumber: 36,
    sectionNumber: 8,
    title: 'Sintaxe: Tipos de Negação em Libras',
    description: 'Abano de cabeça, sinal NÃO, negação incorporada e reversão de movimento.',
    themeColor: 'blue',
    coreSignIds: ['sign_nao_gostar', 'sign_nao_saber', 'sign_desculpas'],
    grammarTitle: 'As 3 Formas de Negar em Libras',
    grammarExplanation: '1. Adicionar o sinal NÃO; 2. Abanar a cabeça negativamente; 3. Verbo com negação incorporada (ex: NÃO-QUERER).',
    exampleGloss: 'EU CARRO TER NAO (com abano de cabeça)',
    examplePt: 'Eu não tenho carro.',
    culturalTip: 'A negação facial pode ser feita de forma simultânea durante a realização do próprio sinal.'
  },
  {
    id: 'u37_tipos_interrogacao',
    unitNumber: 37,
    sectionNumber: 8,
    title: 'Sintaxe: Tipos de Interrogação & Perguntas',
    description: 'Perguntas de Sim/Não (sobrancelhas levantadas) vs Quem/Onde/Por que (franzidas).',
    themeColor: 'blue',
    coreSignIds: ['sign_tudo_bem', 'sign_aprender', 'sign_meu_nome'],
    grammarTitle: 'Marcadores Interrogativos NMF',
    grammarExplanation: 'Perguntas abertas (QUEM, ONDE, QUANDO) exigem sobrancelhas franzidas e cabeça inclinada para frente.',
    exampleGloss: 'VOCE MORAR ONDE? (sobrancelhas franzidas)',
    examplePt: 'Onde você mora?',
    culturalTip: 'Pratique diante da câmera do EasyLib para treinar o movimento das sobrancelhas nos dois tipos de pergunta!'
  },
  {
    id: 'u38_estrutura_topico_comentario',
    unitNumber: 38,
    sectionNumber: 8,
    title: 'Estrutura Sintática: Tópico-Comentário',
    description: 'Organização visual da frase (Objeto primeiro, depois Sujeito e Ação - OSV).',
    themeColor: 'blue',
    coreSignIds: ['sign_casa', 'sign_trabalhar', 'sign_aprender'],
    grammarTitle: 'A Lógica Visual da Libras',
    grammarExplanation: 'Em Libras, primeiro estabelecemos o cenário/objeto no ar, e depois comentamos sobre ele.',
    exampleGloss: 'BOLO GOSTOSO EU COMER (Objeto -> Sujeito -> Verbo)',
    examplePt: 'Eu comi o bolo gostoso.',
    culturalTip: 'Não traduza palavra por palavra do português (português sinalizado); use a estrutura genuína da Libras!'
  },
  {
    id: 'u39_classificadores_dcl',
    unitNumber: 39,
    sectionNumber: 8,
    title: 'Classificadores Descritivos (DCL)',
    description: 'Descrever formas geométricas, texturas, espessuras e contornos tridimensionais.',
    themeColor: 'blue',
    coreSignIds: ['sign_casa', 'sign_aprender', 'sign_saber'],
    grammarTitle: 'DCL: Desenhando no Ar',
    grammarExplanation: 'As mãos atuam como pincéis que desenham a forma exata de um vaso, de uma mesa redonda ou de uma árvore.',
    exampleGloss: 'MESA DCL:redonda-grande COPO DCL:fino-alto',
    examplePt: 'Uma mesa redonda e grande com um copo alto e fino sobre ela.',
    culturalTip: 'Os classificadores transformam a Libras em uma verdadeira pintura tridimensional no ar.'
  },
  {
    id: 'u40_classificadores_icl',
    unitNumber: 40,
    sectionNumber: 8,
    title: 'Classificadores de Instrumento (ICL)',
    description: 'Manipular objetos com precisão: tesoura, chave, faca, martelo e volante.',
    themeColor: 'blue',
    coreSignIds: ['sign_trabalhar', 'sign_casa', 'sign_aprender'],
    grammarTitle: 'ICL: Como Manuseamos os Objetos',
    grammarExplanation: 'As mãos mostram a maneira exata como seguramos e operamos ferramentas reais.',
    exampleGloss: 'EU TESOURA ICL:cortar-papel CUIDADO',
    examplePt: 'Eu cortei o papel com a tesoura cuidadosamente.',
    culturalTip: 'A precisão das articulações manuais demonstra o peso e a resistência física do objeto representado.'
  },

  // SEÇÃO 9: CLASSIFICADORES AVANÇADOS & CULTURA SURDA (Unidades 41 a 45)
  {
    id: 'u41_classificadores_bcl_pcl',
    unitNumber: 41,
    sectionNumber: 9,
    title: 'Classificadores de Corpo & Pessoa (BCL & PCL)',
    description: 'Incorporar posturas humanas, andar mancando, cruzar os braços e multidões.',
    themeColor: 'purple',
    coreSignIds: ['sign_amigo', 'sign_surdo', 'sign_trabalhar'],
    grammarTitle: 'Incorporação Teatral do Personagem',
    grammarExplanation: 'O sinalizador assume o corpo do personagem, seus trejeitos e suas reações emocionais.',
    exampleGloss: 'HOMEM VELHO BCL:andar-curvado-bengala',
    examplePt: 'O senhor idoso caminhava curvado com sua bengala.',
    culturalTip: 'No teatro surdo, a transição fluida entre múltiplos personagens é chamada de Role Shift (Troca de Papéis).'
  },
  {
    id: 'u42_classificadores_vcl',
    unitNumber: 42,
    sectionNumber: 9,
    title: 'Classificadores de Veículos & Movimento (VCL)',
    description: 'Trajetórias espaciais, ultrapassagens, curvas, subidas e colisões.',
    themeColor: 'purple',
    coreSignIds: ['sign_casa', 'sign_trabalhar', 'sign_aprender'],
    grammarTitle: 'VCL: Dinâmica de Trânsito no Espaço',
    grammarExplanation: 'As duas mãos representam veículos distintos manobrando, acelerando e freando no espaço.',
    exampleGloss: 'CARRO1 VCL:ultrapassar CARRO2 VELOCIDADE',
    examplePt: 'O carro ultrapassou o outro veículo em alta velocidade.',
    culturalTip: 'Relatos de trânsito em Libras são ricos em detalhes espaciais de ângulos e distâncias.'
  },
  {
    id: 'u43_espacializacao_tempo',
    unitNumber: 43,
    sectionNumber: 9,
    title: 'Espacialização & Linha do Tempo Complexa',
    description: 'Passado remoto, futuro distante, ações contínuas e repetição temporal.',
    themeColor: 'purple',
    coreSignIds: ['sign_bom_dia', 'sign_aprender', 'sign_trabalhar'],
    grammarTitle: 'Profundidade Temporal no Espaço',
    grammarExplanation: 'Quanto mais para trás do ombro, mais distante no passado; quanto mais à frente, mais longe no futuro.',
    exampleGloss: 'PASSADO DISTANTE ANOS ATRAS MINHA FAMILIA CHEGAR',
    examplePt: 'Muitos anos atrás, no passado remoto, minha família chegou.',
    culturalTip: 'A ancoragem espacial permite narrar histórias inteiras sem repetir os nomes dos personagens.'
  },
  {
    id: 'u44_incorporacao_foco',
    unitNumber: 44,
    sectionNumber: 9,
    title: 'Incorporação de Argumentos & Foco Visual',
    description: 'Olhar direcionado, concordância de gênero visual e foco de atenção.',
    themeColor: 'purple',
    coreSignIds: ['sign_libras', 'sign_ajudar', 'sign_aprender'],
    grammarTitle: 'A Direção do Olhar do Sinalizador',
    grammarExplanation: 'Para onde o sinalizador olha estabelece a presença e a atenção do interlocutor imaginário.',
    exampleGloss: 'EU OLHAR-PARA-CIMA ARVORE PASSARO VER',
    examplePt: 'Olhei para cima e vi um pássaro na árvore.',
    culturalTip: 'O olhar é uma ferramenta sintática fundamental que direciona a atenção do público.'
  },
  {
    id: 'u45_historia_ines_milao',
    unitNumber: 45,
    sectionNumber: 9,
    title: 'História dos Surdos: INES & Congresso de Milão',
    description: 'E. Huet, fundação do INES em 1857, Milão 1880 e a luta da resistência surda.',
    themeColor: 'purple',
    coreSignIds: ['sign_surdo', 'sign_libras', 'sign_aprender'],
    grammarTitle: 'Vocabulário Histórico e Memorial',
    grammarExplanation: 'Termos para resistência, proibição histórica da língua de sinais e conquista de direitos.',
    exampleGloss: 'INES 1857 RIO-DE-JANEIRO COMEÇAR HISTORIA SURDA BRASIL',
    examplePt: 'O INES foi fundado em 1857 no Rio de Janeiro, iniciando a história da educação de surdos no Brasil.',
    culturalTip: 'O Congresso de Milão de 1880 proibiu a língua de sinais nas escolas por 100 anos, gerando um século de resistência.'
  },

  // SEÇÃO 10: FLUÊNCIA TOTAL, INTERPRETAÇÃO & MESTRIA (Unidades 46 a 50)
  {
    id: 'u46_girias_expressoes',
    unitNumber: 46,
    sectionNumber: 10,
    title: 'Gírias & Expressões Idiomáticas da Libras',
    description: 'Pisar na bola, pagar mico, cara de pau, quebrar a cara e expressões nativas.',
    themeColor: 'green',
    coreSignIds: ['sign_libras', 'sign_amigo', 'sign_gostar'],
    grammarTitle: 'Metáforas Visuais Genuínas',
    grammarExplanation: 'Gírias em Libras não traduzem expressões do português; possuem metáforas visuais próprias.',
    exampleGloss: 'PESSOA FALAR MENTIRA, CARA-DE-PAU!',
    examplePt: 'Aquela pessoa mentiu, que cara de pau!',
    culturalTip: 'Gírias variam muito entre jovens surdos em diferentes regiões do Brasil.'
  },
  {
    id: 'u47_papel_interprete_tils',
    unitNumber: 47,
    sectionNumber: 10,
    title: 'O Tradutor & Intérprete TILS',
    description: 'Código de ética, neutralidade, fidelidade, postura profissional e preparo prévio.',
    themeColor: 'green',
    coreSignIds: ['sign_libras', 'sign_trabalhar', 'sign_aprender'],
    grammarTitle: 'TILS: Tradução Simultânea e Consecutiva',
    grammarExplanation: 'O intérprete realiza a mediação comunicativa mantendo a intenção e o afeto do emissor original.',
    exampleGloss: 'INTERPRETE TILS TRABALHAR ETICA RESPEITO',
    examplePt: 'O intérprete TILS trabalha com ética e respeito.',
    culturalTip: 'O dia do Tradutor e Intérprete de Libras é comemorado em 30 de setembro (Dia Internacional do Tradutor).'
  },
  {
    id: 'u48_dialogos_simultaneos',
    unitNumber: 48,
    sectionNumber: 10,
    title: 'Diálogos Complexos & Interpretação Dinâmica',
    description: 'Debates, entrevistas de emprego, consultas complexas e palestras acadêmicas.',
    themeColor: 'green',
    coreSignIds: ['sign_libras', 'sign_ajudar', 'sign_trabalhar'],
    grammarTitle: 'Registro Formal vs Informal',
    grammarExplanation: 'Ajuste do vocabulário e da velocidade da sinalização de acordo com o contexto comunicativo.',
    exampleGloss: 'REUNIAO FORMAL EMPRESA DISCUTIR PROJETO NOVO',
    examplePt: 'Na reunião formal da empresa discutimos o novo projeto.',
    culturalTip: 'Em palestras acadêmicas, o TILS deve dominar o glossário técnico específico da área.'
  },
  {
    id: 'u49_traducoes_juridicas_academicas',
    unitNumber: 49,
    sectionNumber: 10,
    title: 'Libras Acadêmica, Jurídica & Científica',
    description: 'Termos jurídicos, médicos, científicos e publicações acadêmicas em Libras.',
    themeColor: 'green',
    coreSignIds: ['sign_aprender', 'sign_trabalhar', 'sign_libras'],
    grammarTitle: 'Sinais Conceituais Abstratos',
    grammarExplanation: 'Criação e uso de termos acadêmicos para dissertações, teses e pareceres jurídicos em Libras.',
    exampleGloss: 'UNIVERSIDADE PESQUISAR LIBRAS LINGUISTICA IMPORTANTE',
    examplePt: 'A universidade realiza pesquisas linguísticas fundamentais sobre a Libras.',
    culturalTip: 'O curso de Letras Libras forma professores e pesquisadores para expandir o ensino superior no país.'
  },
  {
    id: 'u50_mestria_fluencia_total',
    unitNumber: 50,
    sectionNumber: 10,
    title: 'Mestria & Fluência Completa EasyLib',
    description: 'Desafio final com todos os 5 parâmetros, velocidade natural e maestria em Libras.',
    themeColor: 'green',
    coreSignIds: ['sign_libras', 'sign_eu_te_amo', 'sign_surdo', 'sign_ouvinte'],
    grammarTitle: 'O Ápice da Fluência Visual',
    grammarExplanation: 'Domínio total de sintaxe espacial, velocidade, expressividade e respeito cultural.',
    exampleGloss: 'PARABENS! VOCE LIBRAS DOMINAR FLUENCIA TOTAL!',
    examplePt: 'Parabéns! Você atingiu a fluência completa e domina a Libras!',
    culturalTip: 'Aprender Libras é um compromisso contínuo de amizade, inclusão e respeito com a Comunidade Surda!'
  }
];

// Helper to generate 12 activities (nodes) per unit, with 6-8 exercises per activity
function generateUnitNodes(unitDef: UnitDefinition): PathNode[] {
  const nodes: PathNode[] = [];
  const nodeCount = 12; // 12 activities per unit (meeting 10-15 requirement)

  const titles = [
    'Introdução aos Sinais Fundamentais',
    'Configurações de Mão & Movimento',
    'Reconhecimento Visual & Significado',
    'Prática de Datilologia & Escrita',
    'Construção de Frases em Libras',
    'História & Diálogo Visual em Quadrinhos',
    'Baú de Recompensas do Explorador',
    'Parâmetros Fonológicos em Foco',
    'Expressões Não-Manuais & Rosto',
    'Desafio de Velocidade & Agilidade',
    'Revisão Geral do Conteúdo',
    'Troféu de Maestria da Unidade'
  ];

  for (let i = 0; i < nodeCount; i++) {
    const isChest = i === 6;
    const isTrophy = i === 11;
    const isStory = i === 5;
    const isRapid = i === 9;

    const nodeType = isChest ? 'chest' : isTrophy ? 'trophy' : isStory ? 'story' : isRapid ? 'rapid' : 'lesson';
    const exercises: Exercise[] = [];
    const exerciseCount = 6; // 6 exercises per activity (meeting 5-8 requirement)

    // Generate 6 diverse exercises for this activity
    for (let e = 0; e < exerciseCount; e++) {
      const signIndex = (i + e) % LIBRAS_DICTIONARY.length;
      const targetSign = LIBRAS_DICTIONARY[signIndex];
      const otherSigns = LIBRAS_DICTIONARY.filter(s => s.id !== targetSign.id).slice(0, 3);

      if (e === 0) {
        // Identify sign
        exercises.push({
          id: `ex_u${unitDef.unitNumber}_n${i+1}_${e+1}`,
          type: 'identify_sign',
          prompt: `Qual o significado do sinal de Libras abaixo?`,
          sign: targetSign,
          correctAnswers: [targetSign.name, targetSign.name.toLowerCase()],
          options: [
            { id: 'opt_1', text: targetSign.name, glyph: targetSign.visualGlyph, explanation: targetSign.meaning },
            ...otherSigns.map((os, idx) => ({
              id: `opt_${idx+2}`,
              text: os.name,
              glyph: os.visualGlyph,
              explanation: os.meaning
            }))
          ].sort(() => 0.5 - Math.random()),
          grammarTip: `Dica EasyLib: ${targetSign.description}`
        });
      } else if (e === 1) {
        // Dactylology
        exercises.push({
          id: `ex_u${unitDef.unitNumber}_n${i+1}_${e+1}`,
          type: 'dactylology_spelling',
          prompt: `Observe as mãos do alfabeto manual e soletre a palavra correspondente:`,
          portugueseSentence: targetSign.name.toUpperCase().split('/')[0].trim(),
          correctAnswers: [targetSign.name.toUpperCase().split('/')[0].trim()],
          grammarTip: 'Na datilologia, mantenha a mão firme sem oscilar o cotovelo para facilitar a leitura visual.'
        });
      } else if (e === 2) {
        // Translate to Libras
        exercises.push({
          id: `ex_u${unitDef.unitNumber}_n${i+1}_${e+1}`,
          type: 'translate_to_libras',
          prompt: `Monte a estrutura correta em Libras para a frase:`,
          portugueseSentence: unitDef.examplePt,
          targetGloss: unitDef.exampleGloss,
          wordBank: [...unitDef.exampleGloss.split(' '), 'ONTEM', 'NAO', 'MUITO', 'CASA'].sort(() => 0.5 - Math.random()),
          correctAnswers: [unitDef.exampleGloss.replace(/[!?,]/g, '')],
          grammarTip: `Estrutura Libras: ${unitDef.grammarExplanation}`
        });
      } else if (e === 3) {
        // Match pairs
        const pairs: MatchPair[] = [
          targetSign,
          ...otherSigns
        ].map((s, pIdx) => ({
          id: `pair_${pIdx}`,
          signId: s.id,
          signName: s.name,
          signGlyph: s.visualGlyph,
          handshape: s.handshapeName,
          portugueseText: s.name
        }));

        exercises.push({
          id: `ex_u${unitDef.unitNumber}_n${i+1}_${e+1}`,
          type: 'match_sign_pairs',
          prompt: 'Conecte cada sinal de Libras ao seu significado correspondente em Português:',
          matchPairs: pairs,
          correctAnswers: pairs.map(p => p.signName),
          grammarTip: 'Ligue cada sinal com agilidade visual para fortalecer sua memória associativa.'
        });
      } else if (e === 4) {
        // Parameter Quiz
        exercises.push({
          id: `ex_u${unitDef.unitNumber}_n${i+1}_${e+1}`,
          type: 'parameter_quiz',
          parameterType: 'PA',
          prompt: `Qual o Ponto de Articulação (Altura/Local do corpo) do sinal "${targetSign.name}"?`,
          sign: targetSign,
          correctAnswers: [targetSign.bodyLocation],
          options: [
            { id: 'p_1', text: targetSign.bodyLocation, explanation: `Correto! O sinal ${targetSign.name} é articulado em ${targetSign.bodyLocation}.` },
            { id: 'p_2', text: 'Espaço Neutro (à frente do peito)', explanation: 'Espaço Neutro é usado para sinais como CASA e TRABALHAR.' },
            { id: 'p_3', text: 'Testa / Topo da Cabeça', explanation: 'A testa é usada para sinais de cognição como APRENDER e SABER.' },
            { id: 'p_4', text: 'Queixo / Boca', explanation: 'Queixo e boca são usados para sinais de alimentação e cortesia.' }
          ].sort(() => 0.5 - Math.random()),
          grammarTip: `O Ponto de Articulação (PA) define onde o sinal ganha vida no espaço corporal.`
        });
      } else {
        // NMF Facial or Story dialogue
        if (isStory) {
          exercises.push({
            id: `ex_u${unitDef.unitNumber}_n${i+1}_${e+1}`,
            type: 'story_dialogue',
            prompt: 'Acompanhe a conversa em Libras e responda com precisão:',
            storyLines: [
              {
                speaker: 'Mariana (Surda)',
                avatar: '👩‍🦱',
                librasSentence: `OI! TUDO-BEM? VOCE ${targetSign.name.toUpperCase()} SABER?`,
                portugueseSentence: `Oi! Tudo bem? Você conhece o sinal de ${targetSign.name}?`,
                signExplanation: 'Mariana pergunta sobre o conhecimento do vocabulário em Libras.'
              },
              {
                speaker: 'Gabriel (Ouvinte)',
                avatar: '👨‍🎓',
                librasSentence: `SIM! EU APRENDER EASYLIB, ${targetSign.name.toUpperCase()} GOSTAR MUITO!`,
                portugueseSentence: `Sim! Aprendi no EasyLib e adoro esse sinal!`,
                signExplanation: 'Gabriel responde com alegria confirmando seu aprendizado.'
              }
            ],
            correctAnswers: ['Sim, Gabriel aprendeu no EasyLib'],
            options: [
              { id: 's_1', text: 'Sim, Gabriel aprendeu no EasyLib', explanation: 'Exato! Gabriel confirmou que aprendeu o sinal na plataforma.' },
              { id: 's_2', text: 'Não, ele não sabe o sinal', explanation: 'Ele confirmou que já aprendeu.' },
              { id: 's_3', text: 'Eles estão perdidos na cidade', explanation: 'O tema é o aprendizado de Libras.' }
            ]
          });
        } else {
          exercises.push({
            id: `ex_u${unitDef.unitNumber}_n${i+1}_${e+1}`,
            type: 'nmf_facial_quiz',
            prompt: `Qual Expressão Não-Manual (NMF) é obrigatória ao realizar a pergunta "${unitDef.exampleGloss}"?`,
            correctAnswers: ['Sobrancelhas levantadas e cabeça levemente inclinada para frente'],
            options: [
              { id: 'nmf_1', text: 'Sobrancelhas levantadas e cabeça levemente inclinada para frente', explanation: 'Correto! Perguntas de confirmação direta (Sim/Não) exigem sobrancelhas levantadas.' },
              { id: 'nmf_2', text: 'Sobrancelhas franzidas com olhar sério', explanation: 'Sobrancelhas franzidas são usadas em perguntas com QUEM, ONDE, POR QUÊ.' },
              { id: 'nmf_3', text: 'Rosto sem nenhuma expressão corporal', explanation: 'Sem NMF a frase perde a entonação interrogativa.' },
              { id: 'nmf_4', text: 'Olhos fechados', explanation: 'O contato visual visual deve sempre ser mantido.' }
            ],
            grammarTip: 'As expressões faciais são a voz da Libras! Elas transformam afirmações em perguntas.'
          });
        }
      }
    }

    nodes.push({
      id: `node_u${unitDef.unitNumber}_${i+1}`,
      type: nodeType,
      title: titles[i],
      description: `Atividade ${i+1} da Unidade ${unitDef.unitNumber}: ${titles[i]} com exercícios práticos.`,
      xpReward: isTrophy ? 50 : isChest ? 30 : 20,
      gemsReward: isTrophy ? 25 : isChest ? 40 : 10,
      status: (unitDef.unitNumber === 1 && i === 0) ? 'available' : 'locked',
      exercises: exercises
    });
  }

  return nodes;
}

// Generate the 50 Units
export const ALL_50_UNITS: Unit[] = UNIT_BLUEPRINTS.map(def => ({
  id: def.id,
  unitNumber: def.unitNumber,
  sectionNumber: def.sectionNumber,
  title: `Unidade ${def.unitNumber}: ${def.title}`,
  description: def.description,
  themeColor: def.themeColor,
  guidebook: {
    signsOverview: def.coreSignIds.map(sId => {
      const s = LIBRAS_DICTIONARY.find(x => x.id === sId) || LIBRAS_DICTIONARY[0];
      return {
        sign: s.name.toUpperCase(),
        meaning: s.meaning,
        cm: s.handshapeName,
        pa: s.bodyLocation,
        mov: s.movementType,
        nmf: s.facialExpression
      };
    }),
    grammarRule: {
      title: def.grammarTitle,
      explanation: def.grammarExplanation,
      exampleGloss: def.exampleGloss,
      examplePortuguese: def.examplePt
    },
    culturalTip: def.culturalTip
  },
  nodes: generateUnitNodes(def)
}));

// Build 10 Sections (each containing 5 units)
const SECTION_TITLES = [
  'Seção 1: Fundamentos & Primeiros Contatos (Unidades 1-5)',
  'Seção 2: Cotidiano, Ambientes & Tempo (Unidades 6-10)',
  'Seção 3: Verbos, Ações & Mundo do Trabalho (Unidades 11-15)',
  'Seção 4: Educação, Saúde & Cuidados (Unidades 16-20)',
  'Seção 5: Sociedade, Natureza & Cultura (Unidades 21-25)',
  'Seção 6: Tecnologia, Mídia & Direitos (Unidades 26-30)',
  'Seção 7: Os 5 Parâmetros Fonológicos (Unidades 31-35)',
  'Seção 8: Sintaxe, Negação & Classificadores Básicos (Unidades 36-40)',
  'Seção 9: Classificadores Tridimensionais & História Surda (Unidades 41-45)',
  'Seção 10: Fluência Total, Tradução TILS & Mestria (Unidades 46-50)'
];

const SECTION_DESCRIPTIONS = [
  'Domine o alfabeto manual, saudações diárias, pronomes, família e os primeiros sinais do dia a dia.',
  'Explore cores, alimentação, calendário, números cardinais e descrição do lar em Libras.',
  'Aprenda verbos direcionais, concordância espacial, profissões, meios de transporte e rotinas.',
  'Vocabulário completo de escola, faculdade, sintomas médicos, cuidados de saúde e vestuário.',
  'Descubra o reino animal, natureza, dinheiro, esportes surdolímpicos e poesia visual.',
  'Comunicação digital, aplicativos, estados do Brasil, países do mundo e leis da comunidade surda.',
  'Estudo aprofundado de Configuração de Mão, Ponto de Articulação, Movimento, Orientação e NMF.',
  'Estrutura sintática Tópico-Comentário, os 3 tipos de negação e primeiros classificadores.',
  'Classificadores de corpo, trajetória de veículos, linha do tempo e a história de luta do INES.',
  'Gírias autênticas, código de ética do intérprete TILS, palestras formais e fluência completa.'
];

export const LIBRAS_SECTIONS: Section[] = Array.from({ length: 10 }).map((_, sIdx) => {
  const sectionNum = sIdx + 1;
  const startUnit = sIdx * 5 + 1;
  const endUnit = startUnit + 4;
  const sectionUnits = ALL_50_UNITS.filter(u => u.unitNumber >= startUnit && u.unitNumber <= endUnit);

  return {
    sectionNumber: sectionNum,
    title: SECTION_TITLES[sIdx],
    description: SECTION_DESCRIPTIONS[sIdx],
    units: sectionUnits
  };
});

export const LIBRAS_DAILY_QUESTS: Quest[] = [
  {
    id: 'q_daily_1',
    title: 'Praticante Dedicado',
    description: 'Complete 3 atividades ou lições de Libras hoje.',
    icon: '⚡',
    target: 3,
    current: 1,
    rewardGems: 25,
    rewardXp: 40,
    completed: false,
    claimed: false
  },
  {
    id: 'q_daily_2',
    title: 'Mestre da Câmera & Altura',
    description: 'Pratique 5 minutos no Estúdio de Câmera identificando a altura e o ponto de articulação dos sinais.',
    icon: '📸',
    target: 5,
    current: 2,
    rewardGems: 30,
    rewardXp: 50,
    completed: false,
    claimed: false
  },
  {
    id: 'q_daily_3',
    title: 'Precisão Fonológica',
    description: 'Acerte 10 exercícios consecutivos de Configuração de Mão e Expressão Facial.',
    icon: '🎯',
    target: 10,
    current: 10,
    rewardGems: 40,
    rewardXp: 60,
    completed: true,
    claimed: false
  }
];

export const LIBRAS_QUESTS = LIBRAS_DAILY_QUESTS;

export const LIBRAS_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'flame_streak',
    title: 'Mãos em Chamas',
    description: 'Mantenha sua ofensiva de estudos em Libras ativa por 7 dias seguidos.',
    icon: '🔥',
    tier: 2,
    maxTier: 5,
    currentProgress: 5,
    targetProgress: 7,
    completed: false
  },
  {
    id: 'units_50_master',
    title: 'Grande Mestre das 50 Unidades',
    description: 'Desbloqueie e complete as 50 unidades completas do EasyLib.',
    icon: '👑',
    tier: 1,
    maxTier: 5,
    currentProgress: 3,
    targetProgress: 50,
    completed: false
  },
  {
    id: 'camera_pose_master',
    title: 'Olho de Águia da IA',
    description: 'Pratique 50 sinais no Estúdio com IA identificando postura corporal e altura dos sinais.',
    icon: '🤖',
    tier: 3,
    maxTier: 5,
    currentProgress: 28,
    targetProgress: 50,
    completed: false
  },
  {
    id: 'interpreter_tier',
    title: 'Coração de Intérprete TILS',
    description: 'Acerte 100 exercícios de tradução e sintaxe visual da Libras.',
    icon: '🤟',
    tier: 3,
    maxTier: 5,
    currentProgress: 64,
    targetProgress: 100,
    completed: false
  }
];

export const LIBRAS_LEADERBOARD_USERS: LeaderboardUser[] = [
  { id: 'u_1', name: 'Mariana Silva (TILS)', username: 'mari_libras', avatar: '👩‍🏫', xp: 1450, streak: 28, flag: '🇧🇷' },
  { id: 'u_2', name: 'Gabriel Santos (Surdo)', username: 'biel_sinal', avatar: '🧏‍♂️', xp: 1320, streak: 35, flag: '🇧🇷' },
  { id: 'u_3', name: 'Camila Rocha', username: 'camilinha_sinais', avatar: '👩‍🎓', xp: 1180, streak: 19, flag: '🇧🇷' },
  { id: 'u_4', name: 'Rafael Costa', username: 'rafa_aprendiz', avatar: '👨‍💻', xp: 950, streak: 12, flag: '🇧🇷' },
  { id: 'u_5', name: 'Beatriz Lima', username: 'bia_inclusao', avatar: '👩‍⚕️', xp: 840, streak: 14, flag: '🇧🇷' },
  { id: 'u_6', name: 'Thiago Oliveira', username: 'thiago_mãos', avatar: '🙋‍♂️', xp: 780, streak: 9, flag: '🇧🇷' },
  { id: 'u_7', name: 'Juliana Mendes', username: 'ju_culturasurda', avatar: '🎨', xp: 650, streak: 8, flag: '🇧🇷' },
  { id: 'u_8', name: 'Lucas Ferreira', username: 'lucas_f', avatar: '🧑‍🏫', xp: 520, streak: 5, flag: '🇧🇷' },
  { id: 'u_9', name: 'Fernanda Nogueira', username: 'nanda_libras', avatar: '👩‍🎤', xp: 410, streak: 4, flag: '🇧🇷' },
  { id: 'u_10', name: 'Carlos Eduardo', username: 'kadu_estudos', avatar: '👨‍🎓', xp: 340, streak: 2, flag: '🇧🇷' }
];

export const LEADERBOARD_NAMES = LIBRAS_LEADERBOARD_USERS;

export const DUO_OUTFITS: DuoOutfit[] = [
  {
    id: 'classic',
    name: 'Libi Clássica',
    description: 'Nossa simpática capivara mascote com crachá oficial da Libras.',
    price: 0,
    icon: '✨',
    unlocked: true
  },
  {
    id: 'formal',
    name: 'Libi Intérprete TILS',
    description: 'Traje preto elegante profissional de Tradutor e Intérprete de Libras.',
    price: 400,
    icon: '👔',
    unlocked: false
  },
  {
    id: 'superduo',
    name: 'Super Libi Cósmica',
    description: 'Capa reluzente com poderes de energia e vidas ilimitadas.',
    price: 1000,
    icon: '🦸‍♂️',
    unlocked: false
  },
  {
    id: 'gold',
    name: 'Libi Mãos de Ouro',
    description: 'Banhada em ouro puro para mestres da Língua de Sinais.',
    price: 1500,
    icon: '👑',
    unlocked: false
  }
];
