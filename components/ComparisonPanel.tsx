
import React, { useMemo } from 'react';
import { TransformerGroup } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ComparisonPanelProps {
  groups: TransformerGroup[];
  onClose: () => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ groups, onClose }) => {
  // Prepara dados para o gráfico de comparação
  // Precisamos normalizar as datas para que todos apareçam no mesmo eixo X
  const chartData = useMemo(() => {
    const datesMap: { [date: string]: any } = {};
    groups.forEach(group => {
      group.history.forEach(reading => {
        const dateKey = new Date(reading.data).toISOString().split('T')[0];
        if (!datesMap[dateKey]) datesMap[dateKey] = { date: dateKey };
        datesMap[dateKey][group.sn] = reading.c2h2; // Comparando Acetileno como exemplo
      });
    });
    return Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [groups]);

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Comparativo de Históricos</h2>
            <p className="text-slate-400">Analise a evolução de Acetileno (C2H2) entre equipamentos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-8">
          <div className="bg-slate-800/30 p-6 rounded-2xl h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                />
                <Legend />
                {groups.map((group, i) => (
                  <Line 
                    key={group.sn} 
                    type="monotone" 
                    dataKey={group.sn} 
                    stroke={colors[i % colors.length]} 
                    strokeWidth={3} 
                    name={`${group.tag} (${group.sn})`}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {groups.map(group => (
               <div key={group.sn} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                  <p className="text-white font-bold">{group.tag}</p>
                  <p className="text-xs text-slate-500 font-mono">{group.sn}</p>
                  <div className="mt-3 flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">Média C2H2:</span>
                    <span className="text-xl font-bold text-indigo-400">
                      {(group.history.reduce((acc, h) => acc + h.c2h2, 0) / group.history.length).toFixed(3)}
                    </span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPanel;
