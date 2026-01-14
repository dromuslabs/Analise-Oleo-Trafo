
export enum TransformerStatus {
  NORMAL = 'Normal',
  ALERTA = 'Alerta',
  CRITICO = 'Crítico'
}

export interface TransformerReading {
  id: string;
  sn: string;
  tag: string;
  local: string;
  data: string;
  h2: number;
  ch4: number;
  c2h2: number;
  c2h4: number;
  c2h6: number;
  co: number;
  co2: number;
  temperaturaOleo?: number;
  tcg?: number; // Total Combustible Gases
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
  detectedFault?: string;
}

export interface InsightReport {
  overallHealth: string;
  criticalIssues: string[];
  recommendations: string[];
}
