
import React, { useState, useEffect, useCallback } from 'react';
import { TransformerGroup, TransformerReading, TransformerStatus, InsightReport } from './types';
import DashboardStats from './components/DashboardStats';
import TransformerList from './components/TransformerList';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import DetailModal from './components/DetailModal';
import ComparisonPanel from './components/ComparisonPanel';
import { getAIInsights } from './services/geminiService';

const SHEETY_API_URL = 'https://api.sheety.co/08e6cbbffee520029dcb64480d35d1a8/controleasi/trafo';

const App: React.FC = () => {
  const [groups, setGroups] = useState<TransformerGroup[]>([]);
  const [selectedSns, setSelectedSns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TransformerGroup | null>(null);
  const [aiInsights, setAiInsights] = useState<InsightReport | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const processData = (rawRows: any[]): TransformerGroup[] => {
    const grouped: { [sn: string]: TransformerReading[] } = {};
    
    rawRows.forEach(row => {
      // Sheety retorna chaves em lowercase baseadas no header da planilha
      const sn = (row.sn || row.serie || row.id || 'N/A').toString();
      if (!grouped[sn]) grouped[sn] = [];
      
      const h2 = Number(row.h2) || 0;
      const ch4 = Number(row.ch4) || 0;
      const c2h2 = Number(row.c2h2) || 0;
      const c2h4 = Number(row.c2h4) || 0;
      const c2h6 = Number(row.c2h6) || 0;
      const co = Number(row.co) || 0;

      grouped[sn].push({
        ...row,
        sn,
        id: row.id?.toString(),
        h2, ch4, c2h2, c2h4, c2h6, co,
        co2: Number(row.co2) || 0,
        temperaturaOleo: Number(row.temperaturaOleo) || 0,
        tcg: h2 + ch4 + c2h2 + c2h4 + c2h6 + co,
        data: row.data || new Date().toISOString()
      });
    });

    return Object.keys(grouped).map(sn => {
      const history = grouped[sn].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const lastReading = history[history.length - 1];
      
      // Lógica simplificada IEEE C57.104
      let status = TransformerStatus.NORMAL;
      if (lastReading.c2h2 > 2 || lastReading.h2 > 500) status = TransformerStatus.CRITICO;
      else if (lastReading.c2h2 > 0.5 || lastReading.h2 > 100) status = TransformerStatus.ALERTA;

      return {
        sn,
        tag: lastReading.tag || 'EQUIP-X',
        local: lastReading.local || 'Planta Principal',
        lastReading,
        history,
        status
      };
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(SHEETY_API_URL);
      if (!response.ok) throw new Error('Falha ao conectar com Planilha');
      const data = await response.json();
      const processed = processData(data.trafo || []);
      setGroups(processed);
      setLastUpdated(new Date());
      
      // Insights de IA após carregar dados
      if (processed.length > 0) {
        const insights = await getAIInsights(processed);
        setAiInsights(insights);
      }
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData();
  }, [fetchData]);

  const toggleSelection = (sn: string) => {
    setSelectedSns(prev => 
      prev.includes(sn) ? prev.filter(s => s !== sn) : [...prev, sn]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-24">
        {/* Header Profissional */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-2xl shadow-2xl shadow-indigo-500/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  PowerGrid Monitor
                </h1>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                  Live
                </span>
              </div>
              <p className="text-slate-500 font-medium flex items-center gap-2 text-sm mt-1">
                Análise Preditiva DGA & Inteligência de Ativos
                {lastUpdated && (
                  <span className="text-slate-600 ml-2">• Atualizado: {lastUpdated.toLocaleTimeString()}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {selectedSns.length > 1 && (
              <button 
                onClick={() => setShowComparison(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/20 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Comparar {selectedSns.length} Trafos
              </button>
            )}
            <button 
              onClick={fetchData}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl border border-slate-800 flex items-center gap-3 font-semibold transition-all hover:border-slate-700 disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          </div>
        </header>

        <DashboardStats trafos={groups} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Lista de Ativos Monitorados
                <span className="text-slate-600 font-mono text-sm">({groups.length})</span>
              </h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Alerta
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Crítico
                </span>
              </div>
            </div>
            <TransformerList 
              groups={groups} 
              onSelect={setSelectedGroup} 
              selectedSns={selectedSns}
              onToggleSelection={toggleSelection}
            />
          </div>
          
          <div className="lg:col-span-1 space-y-8">
            <AIAnalysisPanel insights={aiInsights} loading={loading} />
            
            {/* Quick Metrics Card */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-3xl backdrop-blur-sm">
              <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em] mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m-8 13h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Saúde da Frota
              </h3>
              <div className="space-y-4">
                {['Normal', 'Alerta', 'Crítico'].map(status => {
                  const count = groups.filter(g => g.status === status).length;
                  const percentage = (count / (groups.length || 1)) * 100;
                  const color = status === 'Normal' ? 'bg-emerald-500' : status === 'Alerta' ? 'bg-amber-500' : 'bg-rose-500';
                  
                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">{status}</span>
                        <span className="text-white">{count} trafos</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modais */}
        {selectedGroup && (
          <DetailModal 
            group={selectedGroup} 
            onClose={() => setSelectedGroup(null)} 
          />
        )}

        {showComparison && (
          <ComparisonPanel 
            groups={groups.filter(g => selectedSns.includes(g.sn))} 
            onClose={() => setShowComparison(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default App;
