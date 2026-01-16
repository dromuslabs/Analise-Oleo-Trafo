
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

  // Helper para formatar datas com segurança
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
      <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] w-full max-w-7xl max-h-[92vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] custom-scrollbar">
        
        {/* Header do Modal */}
        <div className="p-10 border-b border-slate-800 flex justify-between items-start sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase">{group.tag}</h2>
              <StatusBadge status={group.status} />
            </div>
            <p className="text-slate-500 font-mono text-sm tracking-tight">S/N: {group.sn} • Localidade: {group.local}</p>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Health Score</p>
              <p className={`text-4xl font-black ${scoreColor}`}>{score}%</p>
            </div>
            <button onClick={onClose} className="p-4 bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-2xl transition-all border border-slate-700">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-10 space-y-12">
          
          {/* Diagnóstico da IA */}
          <div className="bg-indigo-600/5 border border-indigo-600/10 rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            
            <h3 className="text-indigo-400 font-black text-[11px] uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              IA Predictive Insights (Gemini 3 Pro)
            </h3>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-20 bg-slate-800 rounded w-full"></div>
              </div>
            ) : trendAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                  <p className="text-slate-200 text-xl font-medium leading-relaxed mb-6">{trendAnalysis.summary}</p>
                  <div className="flex flex-wrap gap-3">
                    {trendAnalysis.patterns.map((p, i) => (
                      <span key={i} className="bg-slate-950/80 border border-slate-800 text-indigo-300 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-wider">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 text-center flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Risco Estimado</p>
                  <p className={`text-4xl font-black ${trendAnalysis.riskLevel === 'Alto' ? 'text-rose-500' : trendAnalysis.riskLevel === 'Médio' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {trendAnalysis.riskLevel}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Gráfico 1: Foco em Gases Críticos */}
            <div className="bg-slate-950/40 p-8 rounded-[3rem] border border-slate-800/50 h-[450px] shadow-inner">
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Correlação Hidrogênio / Acetileno</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[9px] text-slate-500 font-black uppercase">C2H2</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[9px] text-slate-500 font-black uppercase">H2</span></div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={group.history}>
                  <defs>
                    <linearGradient id="colorC2H2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorH2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="data" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight={800}
                    tickFormatter={formatDate} 
                  />
                  <YAxis stroke="#475569" fontSize={10} fontWeight={800} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    labelFormatter={(val) => `Data de Coleta: ${formatDate(val)}`}
                    labelStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px', marginBottom: '10px', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 0' }}
                  />
                  <Area type="monotone" dataKey="c2h2" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorC2H2)" name="Acetileno (ppm)" />
                  <Area type="monotone" dataKey="h2" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorH2)" name="Hidrogênio (ppm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico 2: Evolução Global de Gases */}
            <div className="bg-slate-950/40 p-8 rounded-[3rem] border border-slate-800/50 h-[450px] shadow-inner">
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Tendência Global de Gases (DGA)</h4>
              </div>
              
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={group.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="data" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight={800}
                    tickFormatter={formatDate} 
                  />
                  <YAxis stroke="#475569" fontSize={10} fontWeight={800} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    labelFormatter={(val) => `Data de Coleta: ${formatDate(val)}`}
                    labelStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px', marginBottom: '10px', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 0' }}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px' }} />
                  {gasConfigs.map(gas => (
                    <Line 
                      key={gas.key}
                      type="monotone" 
                      dataKey={gas.key} 
                      stroke={gas.color} 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: gas.color, strokeWidth: 2, stroke: '#020617' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name={gas.label} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid de Medições Brutas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {gasConfigs.map(gas => (
              <div key={gas.key} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center group hover:border-indigo-500/30 transition-all">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{gas.key.toUpperCase()}</p>
                <p className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">
                  {group.lastReading[gas.key as keyof typeof group.lastReading] as number}
                </p>
                <span className="text-[8px] text-slate-700 font-bold uppercase">ppm</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
