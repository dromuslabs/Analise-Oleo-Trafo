
import { GoogleGenAI, Type } from "@google/genai";
import { TransformerGroup, TrendAnalysis } from "../types";

export const getAIInsights = async (groups: TransformerGroup[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = groups.map(g => ({
    sn: g.sn,
    tag: g.tag,
    currentGases: { 
      c2h2: g.lastReading.c2h2, 
      h2: g.lastReading.h2,
      tcg: (g.lastReading.h2 + g.lastReading.ch4 + g.lastReading.c2h2 + g.lastReading.c2h4 + g.lastReading.c2h6 + g.lastReading.co)
    },
    status: g.status
  }));

  const prompt = `Atue como um Engenheiro Especialista em Diagnóstico de Transformadores (DGA - IEEE C57.104). 
  Analise esta frota: ${JSON.stringify(summary)}. 
  Forneça um resumo executivo de saúde, identifique equipamentos em estado crítico e recomende ações imediatas (ex: coleta extra, redução de carga, inspeção interna).`;

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Analise a tendência temporal de gases do transformador SN: ${group.sn}.
  Histórico: ${JSON.stringify(group.history)}.
  Calcule a taxa de geração de gases (ppm/dia). Identifique se há indícios de:
  1. Arqueamento (C2H2 alto)
  2. Descargas Parciais (H2 alto)
  3. Sobreaquecimento Térmico (C2H4/CH4 altos)
  Responda em JSON rigoroso.`;

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
            riskLevel: { type: Type.STRING, enum: ["Baixo", "Médio", "Alto"] },
            detectedFault: { type: Type.STRING }
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
