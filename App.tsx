
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
  const [selectedGroup, setSelectedGroup] = useState<TransformerGroup | null>(null);
  const [aiInsights, setAiInsights] = useState<InsightReport | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const processData = (rawRows: any[]): TransformerGroup[] => {
    const grouped: { [sn: string]: TransformerReading[] } = {};
    
    rawRows.forEach(row => {
      const sn = (row.sn || row.id || 'N/A').toString();
      if (!grouped[sn]) grouped[sn] = [];
      grouped[sn].push({
        ...row,
        sn,
        id: row.id?.toString(),
        h2: Number(row.h2) || 0,
        ch4: Number(row.ch4) || 0,
        c2h2: Number(row.c2h2) || 0,
        c2h4: Number(row.c2h4) || 0,
        c2h6: Number(row.c2h6) || 0,
        co: Number(row.co) || 0,
        co2: Number(row.co2) || 0,
        data: row.data || row.ultimaLeitura || new Date().toISOString()
      });
    });

    return Object.keys(grouped).map(sn => {
      const history = grouped[sn].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const lastReading = history[history.length - 1];
      
      // Lógica de Status Baseada no Último Registro
      let status = TransformerStatus.NORMAL;
      if (lastReading.c2h2 > 1 || lastReading.h2 > 1000) status = TransformerStatus.CRITICO;
      else if (lastReading.c2h2 > 0.1 || lastReading.h2 > 100) status = TransformerStatus.ALERTA;

      return {
        sn,
        tag: lastReading.tag || 'S/ Tag',
        local: lastReading.local || 'N/A',
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
      const data = await response.json();
      const processed = processData(data.trafo || []);
      setGroups(processed);
      
      const insights = await getAIInsights(processed);
      setAiInsights(insights);
    } catch (err) {
      console.error("Erro fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelection = (sn: string) => {
    setSelectedSns(prev => 
      prev.includes(sn) ? prev.filter(s => s !== sn) : [...prev, sn]
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 text-slate-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">DGA Analytics Pro</h1>
            <p className="text-slate-400 font-medium">Histórico Consolidado por SN & Inteligência de Falhas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedSns.length > 1 && (
            <button 
              onClick={() => setShowComparison(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl transition-all font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              Comparar ({selectedSns.length})
            </button>
          )}
          <button 
            onClick={fetchData}
            className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 font-semibold"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sincronizar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <TransformerList 
            groups={groups} 
            onSelect={setSelectedGroup} 
            selectedSns={selectedSns}
            onToggleSelection={toggleSelection}
          />
        </div>
        <div className="space-y-6">
          <AIAnalysisPanel insights={aiInsights} loading={loading} />
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-4">Métricas de Frota</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                <p className="text-slate-500 text-xs mb-1">Total SNs</p>
                <p className="text-2xl font-bold">{groups.length}</p>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                <p className="text-slate-500 text-xs mb-1">Leituras</p>
                <p className="text-2xl font-bold">{groups.reduce((acc, g) => acc + g.history.length, 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
  );
};

export default App;
