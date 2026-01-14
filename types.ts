
export enum TransformerStatus {
  NORMAL = 'Normal',
  ALERTA = 'Alerta',
  CRITICO = 'Crítico'
}

export interface TransformerReading {
  id: string; // ID da linha na planilha
  sn: string; // Chave única do transformador
  tag: string;
  local: string;
  data: string; // Data da coleta
  h2: number;
  ch4: number;
  c2h2: number;
  c2h4: number;
  c2h6: number;
  co: number;
  co2: number;
  temperaturaOleo?: number;
}

export interface TransformerGroup {
  sn: string;
  tag: string;
  local: string;
  lastReading: TransformerReading;
  history: TransformerReading[];
  status: TransformerStatus;
}

export interface TrendAnalysis {
  summary: string;
  patterns: string[];
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
}

export interface InsightReport {
  overallHealth: string;
  criticalIssues: string[];
  recommendations: string[];
}

export interface SheetyResponse {
  trafo: any[];
}
