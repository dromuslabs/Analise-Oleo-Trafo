
import { GoogleGenAI, Type } from "@google/genai";
import { TransformerGroup, TrendAnalysis, InsightReport } from "../types";

// Inicialização segura - A chave é injetada via variável de ambiente no deploy
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getAIInsights = async (groups: TransformerGroup[]): Promise<InsightReport | null> => {
  if (!process.env.API_KEY) return null;

  const fleetSummary = groups.map(g => ({
    tag: g.tag,
    sn: g.sn,
    status: g.status,
    gases: { 
      c2h2: g.lastReading.c2h2, 
      h2: g.lastReading.h2,
      tcg: g.lastReading.tcg
    }
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Atue como Engenheiro Especialista em Manutenção Preditiva (Especialista em DGA - IEEE C57.104). 
      Analise esta frota de transformadores: ${JSON.stringify(fleetSummary)}. 
      Forneça um resumo executivo da saúde da frota, liste problemas críticos detectados e recomende ações imediatas.`,
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
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analise a tendência temporal de gases do transformador TAG: ${group.tag} (SN: ${group.sn}).
      Histórico técnico: ${JSON.stringify(group.history)}.
      Identifique padrões de falha (Arco Elétrico, Descarga Térmica, Corona) e calcule o nível de risco técnico.`,
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
    console.error("Erro Trend Analysis:", error);
    return null;
  }
};
