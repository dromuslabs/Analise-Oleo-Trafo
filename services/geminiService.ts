
import { GoogleGenAI, Type } from "@google/genai";
import { TransformerGroup, TransformerReading, TrendAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIInsights = async (groups: TransformerGroup[]) => {
  const summary = groups.map(g => ({
    sn: g.sn,
    tag: g.tag,
    currentGases: { c2h2: g.lastReading.c2h2, h2: g.lastReading.h2 },
    trend: g.history.length > 1 ? "Analisando histórico de " + g.history.length + " coletas" : "Primeira coleta"
  }));

  const prompt = `Como especialista em DGA (IEEE C57.104), analise o estado atual desta frota de transformadores: ${JSON.stringify(summary)}. 
  Forneça um resumo executivo de saúde, identifique SNs críticos e recomende ações imediatas.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallHealth: { type: Type.STRING },
            criticalIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["overallHealth", "criticalIssues", "recommendations"]
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Erro AI Insights:", error);
    return null;
  }
};

export const analyzeTrends = async (group: TransformerGroup): Promise<TrendAnalysis | null> => {
  const prompt = `Analise o HISTÓRICO COMPLETO de gases do transformador SN: ${group.sn} (TAG: ${group.tag}).
  Dados históricos (ordenados por data): ${JSON.stringify(group.history)}.
  Considere a taxa de evolução dos gases ppm/mês. Verifique se há falhas térmicas ou elétricas em desenvolvimento.
  Responda em JSON com summary, patterns (lista de strings) e riskLevel (Baixo, Médio, Alto).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskLevel: { type: Type.STRING, enum: ["Baixo", "Médio", "Alto"] }
          },
          required: ["summary", "patterns", "riskLevel"]
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    return null;
  }
};
