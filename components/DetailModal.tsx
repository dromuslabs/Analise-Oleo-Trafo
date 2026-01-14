
import React, { useState, useEffect } from 'react';
import { TransformerGroup, TrendAnalysis } from '../types';
import StatusBadge from './StatusBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/90 z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              SN: <span className="font-mono text-indigo-400">{group.sn}</span>
              <StatusBadge status={group.status} />
            </h2>
            <p className="text-slate-400">TAG: {group.tag} • {group.local}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* AI Trends Panel */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
            <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Diagnóstico Evolutivo (IA)
            </h3>
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded"></div>
                </div>
              </div>
            ) : trendAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <p className="text-slate-300 text-lg mb-4">{trendAnalysis.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {trendAnalysis.patterns.map((p, i) => (
                      <span key={i} className="bg-slate-800 text-indigo-300 text-xs px-3 py-1 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl text-center border border-slate-700">
                  <p className="text-slate-500 text-xs uppercase mb-1">Risco Detectado</p>
                  <p className={`text-3xl font-black ${trendAnalysis.riskLevel === 'Alto' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {trendAnalysis.riskLevel}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Historical Real Data Chart */}
          <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 h-[400px]">
            <h4 className="text-white font-bold mb-6">Histórico Real de Gases (PPM)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={group.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="data" stroke="#64748b" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  labelFormatter={(val) => `Data: ${new Date(val).toLocaleDateString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="c2h2" stroke="#f43f5e" strokeWidth={3} name="Acetileno (C2H2)" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="h2" stroke="#3b82f6" strokeWidth={2} name="Hidrogênio (H2)" />
                <Line type="monotone" dataKey="ch4" stroke="#10b981" strokeWidth={2} name="Metano (CH4)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
