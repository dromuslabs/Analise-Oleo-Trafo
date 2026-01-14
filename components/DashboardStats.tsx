
import React from 'react';
// Fix: Changed Transformer to TransformerGroup as Transformer is not exported from types.ts
import { TransformerGroup, TransformerStatus } from '../types';

interface DashboardStatsProps {
  trafos: TransformerGroup[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ trafos }) => {
  const total = trafos.length;
  const critical = trafos.filter(t => t.status === TransformerStatus.CRITICO).length;
  const alert = trafos.filter(t => t.status === TransformerStatus.ALERTA).length;
  // Fix: temperaturaOleo is inside lastReading in TransformerGroup
  const avgTemp = trafos.reduce((acc, t) => acc + (t.lastReading.temperaturaOleo || 0), 0) / (total || 1);

  const stats = [
    { label: 'Total de Trafos', value: total, color: 'text-blue-400' },
    { label: 'Estado Crítico', value: critical, color: 'text-rose-500' },
    { label: 'Em Alerta', value: alert, color: 'text-amber-400' },
    { label: 'Temp. Média Óleo', value: `${avgTemp.toFixed(1)}°C`, color: 'text-indigo-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
