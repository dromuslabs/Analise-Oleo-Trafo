
import React, { useState, useEffect } from 'react';
import { TransformerGroup, TrendAnalysis } from '../types';
import StatusBadge from './StatusBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { analyzeTrends } from '../services/geminiService';

interface DetailModalProps {
  group: TransformerGroup | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ group, onClose }) => {
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      const getAnalysis = async () => {
        setLoading(true);
        const res = await analyzeTrends(group);
        setTrendAnalysis(res);
        setLoading(false);
      };
      getAnalysis();
    }
  }, [group]);

  if (!group) return null;

  const score = (group as any).healthScore || 0;
  const scoreColor = score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-500';

  const gasConfigs = [
    { key: 'h2', color: '#6366f1', label: 'Hidrogênio (H2)' },
    { key: 'ch4', color: '#10b981', label: 'Metano (CH4)' },
    { key: 'c2h2', color: '#f43f5e', label: 'Acetileno (C2H2)' },
    { key: 'c2h4', color: '#f59e0b', label: 'Etileno (C2H4)' },
    { key: 'c2h6', color: '#8b5cf6', label: 'Etano (C2H6)' },
    { key: 'co', color: '#06b6d4', label: 'Monóxido de Carbono (CO)' },
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-2xl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-[3.5rem] w-full max-w-7xl h-full max-h-[95vh] overflow-y-auto shadow-2xl custom-scrollbar flex flex-col">
        
        {/* Header - Mobile Adaptive */}
        <div className="p-4 sm:p-6 lg:p-10 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sticky top-0 bg-slate-900/95 backdrop-blur-md z-20 gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">{group.tag}</h2>
              <StatusBadge status={group.status} />
            </div>
            <p className="text-slate-500 font-mono text-[9px] lg:text-sm tracking-tight">{group.sn} • {group.local}</p>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 lg:gap-10">
            <div className="text-left sm:text-right">
              <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Health Score</p>
              <p className={`text-xl lg:text-4xl font-black ${scoreColor}`}>{score}%</p>
            </div>
            <button onClick={onClose} className="p-2 sm:p-3 lg:p-4 bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-slate-700">
              <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-12">
          
          {/* AI Diagnostic - Mobile Optimized */}
          <div className="bg-indigo-600/5 border border-indigo-600/10 rounded-xl lg:rounded-[3rem] p-4 sm:p-6 lg:p-10 relative overflow-hidden">
            <h3 className="text-indigo-400 font-black text-[9px] lg:text-[11px] uppercase tracking-[0.3em] mb-4 lg:mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
              IA Predictive Insights
            </h3>

            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-12 lg:h-20 bg-slate-800 rounded w-full"></div>
              </div>
            ) : trendAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-12">
                <div className="lg:col-span-3">
                  <p className="text-slate-200 text-xs sm:text-sm lg:text-xl font-medium leading-relaxed mb-4 lg:mb-6">{trendAnalysis.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {trendAnalysis.patterns.map((p, i) => (
                      <span key={i} className="bg-slate-950/80 border border-slate-800 text-indigo-300 text-[8px] lg:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-4 lg:p-8 rounded-xl border border-slate-800 text-center flex flex-col justify-center order-first lg:order-last">
                  <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase mb-1 tracking-widest">Risco Estimado</p>
                  <p className={`text-xl lg:text-4xl font-black ${trendAnalysis.riskLevel === 'Alto' ? 'text-rose-500' : trendAnalysis.riskLevel === 'Médio' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {trendAnalysis.riskLevel}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
            {/* Chart 1 */}
            <div className="bg-slate-950/40 p-3 lg:p-8 rounded-xl lg:rounded-[3rem] border border-slate-800/50 h-[250px] sm:h-[300px] lg:h-[450px]">
              <div className="flex justify-between items-center mb-4 lg:mb-8">
                <h4 className="text-white font-black text-[8px] lg:text-[10px] uppercase tracking-widest">H2 vs C2H2</h4>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-rose-500"></div><span className="text-[7px] text-slate-500 font-black uppercase">C2H2</span></div>
                  <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-indigo-500"></div><span className="text-[7px] text-slate-500 font-black uppercase">H2</span></div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={group.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="data" stroke="#475569" fontSize={8} fontWeight={800} tickFormatter={formatDate} hide={window.innerWidth < 400} />
                  <YAxis stroke="#475569" fontSize={8} fontWeight={800} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '9px' }} />
                  <Area type="monotone" dataKey="c2h2" stroke="#f43f5e" strokeWidth={2} fillOpacity={0.1} fill="#f43f5e" name="C2H2" />
                  <Area type="monotone" dataKey="h2" stroke="#6366f1" strokeWidth={1.5} fillOpacity={0.1} fill="#6366f1" name="H2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2 */}
            <div className="bg-slate-950/40 p-3 lg:p-8 rounded-xl lg:rounded-[3rem] border border-slate-800/50 h-[250px] sm:h-[300px] lg:h-[450px]">
              <div className="flex justify-between items-center mb-4 lg:mb-8">
                <h4 className="text-white font-black text-[8px] lg:text-[10px] uppercase tracking-widest">Tendência Global</h4>
              </div>
              
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={group.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="data" stroke="#475569" fontSize={8} fontWeight={800} tickFormatter={formatDate} hide={window.innerWidth < 400} />
                  <YAxis stroke="#475569" fontSize={8} fontWeight={800} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '9px' }} />
                  {gasConfigs.map(gas => (
                    <Line key={gas.key} type="monotone" dataKey={gas.key} stroke={gas.color} strokeWidth={1.5} dot={false} name={gas.key.toUpperCase()} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Medições Brutas Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 lg:gap-6 pb-6">
            {gasConfigs.map(gas => (
              <div key={gas.key} className="bg-slate-900 border border-slate-800 p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-3xl text-center">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{gas.key.toUpperCase()}</p>
                <p className="text-sm lg:text-2xl font-black text-white">
                  {group.lastReading[gas.key as keyof typeof group.lastReading] as number}
                </p>
                <span className="text-[6px] lg:text-[8px] text-slate-700 font-bold uppercase">ppm</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
