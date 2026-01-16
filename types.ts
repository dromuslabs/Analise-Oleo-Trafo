
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
  tcg?: number;
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

// Novos tipos baseados na sua planilha
export interface HeatData {
  se: string;
  equipamento: string;
  temperatura: number;
}

export interface FieldAnomaly {
  data: string;
  os: string;
  seArea: string;
  circuitoParque: string;
  equipamento: string;
  anomalia: string;
  diasCorridos: number;
  prioridade: string;
  status: string;
  nota: string;
}

export interface ProtectionUnit {
  parque: string;
  unit: string;
  snPainel: string;
  painel: string;
  snRele: string;
  snModulo: string;
  statusComunica: string;
  statusProtecao: string;
}

export interface ManualRegistry {
  ativoparque: string;
  data: string;
  gravidade: string;
  tipo: string;
  observacaotecnica: string;
}
