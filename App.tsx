
import React, { useState, useEffect, useCallback } from 'react';
import { TransformerGroup, TransformerReading, TransformerStatus, InsightReport } from './types';
import DashboardStats from './components/DashboardStats';
import TransformerList from './components/TransformerList';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import DetailModal from './components/DetailModal';
import { getAIInsights } from './services/geminiService';

const DEFAULT_SHEETY_API = 'https://api.sheety.co/08e6cbbffee520029dcb64480d35d1a8/controleasi/trafo';

const App: React.FC = () => {
  const [groups, setGroups] = useState<TransformerGroup[]>([]);
  const [selectedSns, setSelectedSns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TransformerGroup | null>(null);
  const [aiInsights, setAiInsights] = useState<InsightReport | null>(null);
  const [apiUrl] = useState(() => localStorage.getItem('powergrid_api_url') || DEFAULT_SHEETY_API);

  const processData = (rawRows: any[]): TransformerGroup[] => {
    const grouped: { [sn: string]: TransformerReading[] } = {};
    
    rawRows.forEach(row => {
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
      
      let status = TransformerStatus.NORMAL;
      if (lastReading.c2h2 > 1.5 || lastReading.h2 > 400) status = TransformerStatus.CRITICO;
      else if (lastReading.c2h2 > 0.3 || lastReading.h2 > 100) status = TransformerStatus.ALERTA;

      return {
        sn,
        tag: lastReading.tag || 'TRAFO-X',
        local: lastReading.local || 'Planta Operacional',
        lastReading,
        history,
        status
      };
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Falha na sincronização');
      const data = await response.json();
      
      const dataKey = Object.keys(data)[0];
      const rows = data[dataKey] || [];
      
      const processed = processData(rows);
      setGroups(processed);
      setLastUpdated(new Date());
      
      if (processed.length > 0) {
        const insights = await getAIInsights(processed);
        setAiInsights(insights);
      }
    } catch (err) {
      console.error("Erro de Rede:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => { 
    fetchData();
  }, [fetchData]);

  const toggleSelection = (sn: string) => {
    setSelectedSns(prev => 
      prev.includes(sn) ? prev.filter(s => s !== sn) : [...prev, sn]
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 border-b border-slate-900 pb-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-600/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">PowerGrid AI</h1>
            </div>
            <p className="text-slate-500 font-medium">Monitoramento Predisivo de Transformadores (IEEE C57.104)</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Sincronizando' : 'Sincronizar Frota'}
            </button>
          </div>
        </header>

        <DashboardStats trafos={groups} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3">
             <TransformerList 
                groups={groups} 
                onSelect={setSelectedGroup} 
                selectedSns={selectedSns}
                onToggleSelection={toggleSelection}
             />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <AIAnalysisPanel insights={aiInsights} loading={loading} />
            <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800">
               <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Status da Planta</h3>
               <div className="space-y-4">
                  {['Normal', 'Alerta', 'Crítico'].map(status => {
                    const count = groups.filter(g => g.status === status).length;
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-sm">{status}</span>
                        <span className={`text-sm font-black ${status === 'Crítico' ? 'text-rose-500' : status === 'Alerta' ? 'text-amber-500' : 'text-emerald-500'}`}>{count} Ativos</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>
      </div>

      {selectedGroup && (
        <DetailModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
      )}
    </div>
  );
};

export default App;
