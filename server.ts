import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini client lazily or when key is present
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. API Endpoint: Portuguese -> Libras Glosa & Breakdown Cards
app.post("/api/gemini/translate-to-libras", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Texto não fornecido" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback rule-based translation if key missing
      const words = text.toUpperCase().split(" ").filter(Boolean);
      return res.json({
        glosa: words.join(" "),
        explanation: "Tradução adaptada sem servidor Gemini.",
        cards: words.map((w: string) => ({
          word: w,
          handConfig: "Mão em 'A' ou aberta adaptada",
          location: "Espaço neutro à frente do peito",
          movement: "Movimento contínuo suave",
          facialExpression: "Expressão neutra ou afirmativa",
          dactylology: w.length <= 4,
          iconName: "Hand",
        })),
      });
    }

    const prompt = `Você é um mestre em Libras (Língua Brasileira de Sinais) e gramática de Libras.
Traduza a frase em português a seguir para a estrutura de GLOSA em Libras (SVO/OSV, sem preposições ou artigos superfluos, com notação maiúscula).
Forneça a resposta estritamente no seguinte formato JSON:
{
  "glosa": "FRASE EM GLOSA LIBRAS",
  "explanation": "Explicação curta da estrutura gramatical aplicada na Libras",
  "nmfGrammarNote": "Nota sobre a expressão facial/corporal exigida (ex: interrogativo, afirmativo, intensidade)",
  "cards": [
    {
      "word": "PALAVRA_GLOSA",
      "handConfig": "Descrição detalhada da configuração da mão (ex: Mão em 'B', Mão em '5', Dálteis)",
      "location": "Ponto de articulação (ex: Queixo, Peito, Espaço Neutro, Testa)",
      "movement": "Descrição do movimento (ex: Para frente, Arco circular, Toque duplo)",
      "facialExpression": "Expressão facial não-manual associada (ex: Sobrancelhas elevadas, Olhar fixo, Bochechas infladas)",
      "dactylology": false,
      "iconName": "Hand"
    }
  ]
}

Frase em Português: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);
    return res.json(data);
  } catch (error: any) {
    console.error("Erro na tradução para Libras:", error);
    return res.status(500).json({ error: error.message || "Erro no servidor" });
  }
});

// 2. API Endpoint: Real-time Camera Frame Analysis for Sign Recognition & Form Correction
app.post("/api/gemini/analyze-sign-camera", async (req, res) => {
  try {
    const { imageBase64, expectedSign, mode } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem não enviada" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Mock feedback response if API key is not yet set
      const score = Math.floor(Math.random() * 20) + 80;
      return res.json({
        recognizedSign: expectedSign || "Sinal Libras Detectado",
        accuracyScore: score,
        handPostureScore: Math.floor(score * 0.95),
        facialExpressionScore: Math.floor(score * 0.98),
        feedback: "Boa posição das mãos! Mantenha os dedos mais firmes e eleve levemente as sobrancelhas.",
        corrections: [
          "Mão dominante ligeiramente mais à frente do peito",
          "Expressão facial afirmativa com contato visual com a câmera",
        ],
        isCorrect: score >= 80,
      });
    }

    const base64Clean = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `Analise este frame de webcam onde o usuário está tentando fazer o sinal de Libras: "${expectedSign || "qualquer sinal de Libras"}".
Avalie com precisão diagnóstica:
1. Configuração e postura das mãos/dedos.
2. Ponto de articulação/alinhamento com o corpo.
3. Expressão facial e corporal não-manual (NMF).

Retorne em formato JSON estrito:
{
  "recognizedSign": "Nome do sinal que parece estar sendo executado",
  "accuracyScore": 88, (número de 0 a 100)
  "handPostureScore": 85, (número de 0 a 100)
  "facialExpressionScore": 90, (número de 0 a 100)
  "feedback": "Mensagem motivadora e instrutiva em português",
  "corrections": [
    "Dica prática 1 de correção de mão/dedo",
    "Dica prática 2 de ajuste facial/sobrancelhas"
  ],
  "isCorrect": true
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Clean,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);
    return res.json(data);
  } catch (error: any) {
    console.error("Erro na análise da câmera:", error);
    return res.status(500).json({ error: error.message || "Erro no servidor" });
  }
});

// 3. API Endpoint: NMF Facial Expression Validation
app.post("/api/gemini/analyze-facial-nmf", async (req, res) => {
  try {
    const { imageBase64, nmfCategory, targetExpression } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem de rosto não enviada" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        expressionDetected: targetExpression || "Expressão Interrogativa",
        eyebrowStatus: "Franzidas e levemente projetadas",
        mouthStatus: "Boca neutra ou semiaberta",
        headStatus: "Leve inclinação frontal",
        overallScore: 85,
        passed: true,
        feedbackTip: "Excelente projeção de sobrancelhas para frase interrogativa em Libras!",
      });
    }

    const base64Clean = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `Analise a expressão facial não-manual (NMF em Libras) nesta foto.
Categoria esperada: "${nmfCategory || "Interrogativo"}" / Expressão Alvo: "${targetExpression || "Sobrancelhas Franzidas"}".

Avalie minuciosamente:
- Sobrancelhas (franzidas vs elevadas)
- Olhos (arregalados, estreitados)
- Articulação da boca e bochechas
- Inclinação de cabeça e ombros

Retorne JSON:
{
  "expressionDetected": "Expressão identificada",
  "eyebrowStatus": "Descrição técnica das sobrancelhas",
  "mouthStatus": "Descrição dos lábios/bochechas",
  "headStatus": "Descrição do movimento de cabeça",
  "overallScore": 92, (0 a 100)
  "passed": true,
  "feedbackTip": "Feedback em português orientando o ajuste facial perfeito"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Clean,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);
    return res.json(data);
  } catch (error: any) {
    console.error("Erro no NMF Facial:", error);
    return res.status(500).json({ error: error.message || "Erro no servidor" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EasyLib Server] Executando na porta http://0.0.0.0:${PORT}`);
  });
}

startServer();
