
import React, { useMemo } from 'react';
import { TransformerGroup } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ComparisonPanelProps {
  groups: TransformerGroup[];
  onClose: () => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ groups, onClose }) => {
  const chartData = useMemo(() => {
    const datesMap: { [date: string]: any } = {};
    groups.forEach(group => {
      group.history.forEach(reading => {
        const dateKey = new Date(reading.data).toISOString().split('T')[0];
        if (!datesMap[dateKey]) datesMap[dateKey] = { date: dateKey };
        datesMap[dateKey][group.sn] = reading.c2h2;
      });
    });
    return Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [groups]);

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl w-full max-w-6xl h-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">Comparativo</h2>
            <p className="text-[10px] sm:text-xs text-slate-400">Evolução de C2H2 entre ativos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-white">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 sm:p-8 flex-1 overflow-y-auto space-y-6 sm:space-y-8 custom-scrollbar">
          <div className="bg-slate-800/30 p-3 sm:p-6 rounded-xl sm:rounded-2xl h-[250px] sm:h-[400px] lg:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={8} tickFormatter={(v) => new Date(v).toLocaleDateString()} hide={window.innerWidth < 500} />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '9px' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                {groups.map((group, i) => (
                  <Line 
                    key={group.sn} 
                    type="monotone" 
                    dataKey={group.sn} 
                    stroke={colors[i % colors.length]} 
                    strokeWidth={2} 
                    name={group.tag}
                    connectNulls
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-6">
             {groups.map(group => (
               <div key={group.sn} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold text-sm">{group.tag}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{group.sn}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-400">
                      {(group.history.reduce((acc, h) => acc + h.c2h2, 0) / group.history.length).toFixed(3)} ppm
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
