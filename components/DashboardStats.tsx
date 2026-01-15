
import React from 'react';
import { TransformerGroup, TransformerStatus } from '../types';

interface DashboardStatsProps {
  trafos: TransformerGroup[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ trafos }) => {
  const total = trafos.length;
  const critical = trafos.filter(t => t.status === TransformerStatus.CRITICO).length;
  const alert = trafos.filter(t => t.status === TransformerStatus.ALERTA).length;
  const avgTemp = trafos.reduce((acc, t) => acc + (t.lastReading.temperaturaOleo || 0), 0) / (total || 1);

  const stats = [
    { label: 'Total de Ativos', value: total, color: 'text-indigo-400', sub: 'Em operação' },
    { label: 'Estado Crítico', value: critical, color: 'text-rose-500', sub: 'Risco imediato' },
    { label: 'Em Alerta', value: alert, color: 'text-amber-400', sub: 'Acompanhamento' },
    { label: 'Temp. Média Óleo', value: `${avgTemp.toFixed(1)}°C`, color: 'text-blue-400', sub: 'Carga nominal' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 p-6 rounded-[1.5rem] shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
             <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.15em] mb-2">{stat.label}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <span className="text-[10px] text-slate-600 font-medium uppercase">{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
