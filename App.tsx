
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TransformerGroup, 
  TransformerReading, 
  TransformerStatus, 
  InsightReport,
  HeatData,
  FieldAnomaly,
  ProtectionUnit as ProtectionUnitType,
  ManualRegistry
} from './types';
import DashboardStats from './components/DashboardStats';
import TransformerList from './components/TransformerList';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import DetailModal from './components/DetailModal';
import AnomalyDetailModal from './components/AnomalyDetailModal';
import HeatDetailModal from './components/HeatDetailModal';
import ComparisonPanel from './components/ComparisonPanel';
import AnomaliesTab from './components/AnomaliesTab';
import ProtectionUnit from './components/ProtectionUnit';
import { getAIInsights } from './services/geminiService';

const BASE_API = 'https://api.sheety.co/08e6cbbffee520029dcb64480d35d1a8/controleasi';

type TabType = 'dga' | 'aquecimento' | 'campo' | 'reles' | 'registros' | 'novo-registro';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dga');
  const [loading, setLoading] = useState(true);
  
  const [dgaData, setDgaData] = useState<TransformerGroup[]>([]);
  const [heatData, setHeatData] = useState<HeatData[]>([]);
  const [fieldAnomalies, setFieldAnomalies] = useState<FieldAnomaly[]>([]);
  const [protectionData, setProtectionData] = useState<ProtectionUnitType[]>([]);
  const [registries, setRegistries] = useState<ManualRegistry[]>([]);
  
  const [selectedGroup, setSelectedGroup] = useState<TransformerGroup | null>(null);
  const [selectedFieldAnomaly, setSelectedFieldAnomaly] = useState<FieldAnomaly | null>(null);
  const [selectedHeatData, setSelectedHeatData] = useState<HeatData | null>(null);
  const [selectedSns, setSelectedSns] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [aiInsights, setAiInsights] = useState<InsightReport | null>(null);

  const safeParseDate = (dateVal: any): string => {
    if (!dateVal) return new Date().toISOString();
    let d = new Date(dateVal);
    if (isNaN(d.getTime()) && typeof dateVal === 'string') {
      const parts = dateVal.split(/[\/\-\s]/);
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
        d = new Date(year, month, day);
      }
    }
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const processDGA = (rows: any[]): TransformerGroup[] => {
    const grouped: { [sn: string]: TransformerReading[] } = {};
    rows.forEach(row => {
      const sn = (row.sn || row.serie || row.id || 'N/A').toString();
      if (!grouped[sn]) grouped[sn] = [];
      grouped[sn].push({
        ...row,
        sn,
        id: row.id?.toString() || crypto.randomUUID(),
        h2: Number(row.h2) || 0,
        ch4: Number(row.ch4) || 0,
        c2h2: Number(row.c2h2) || 0,
        c2h4: Number(row.c2h4) || 0,
        c2h6: Number(row.c2h6) || 0,
        co: Number(row.co) || 0,
        co2: Number(row.co2) || 0,
        // Prioriza 'dataColeta' ou 'datacoleta' vindo da planilha
        data: safeParseDate(row.datacoleta || row.dataColeta || row.data || row.Data)
      });
    });
    return Object.keys(grouped).map(sn => {
      const history = grouped[sn].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const last = history[history.length - 1];
      const status = last.c2h2 > 1.0 ? TransformerStatus.CRITICO : last.c2h2 > 0.2 ? TransformerStatus.ALERTA : TransformerStatus.NORMAL;
      
      let score = 100;
      if (last.c2h2 > 0.5) score -= 40;
      if (last.h2 > 100) score -= 20;

      return { sn, tag: last.tag || 'EQUIP', local: last.local || 'Planta', lastReading: last, history, status, healthScore: score };
    }) as any;
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [resDga, resHeat, resField, resProt, resReg] = await Promise.all([
        fetch(`${BASE_API}/trafo`).then(r => r.json()),
        fetch(`${BASE_API}/aquecimento`).then(r => r.json()),
        fetch(`${BASE_API}/anomalias`).then(r => r.json()),
        fetch(`${BASE_API}/releunit`).then(r => r.json()),
        fetch(`${BASE_API}/registro`).then(r => r.json())
      ]);

      if (resDga.trafo) setDgaData(processDGA(resDga.trafo));
      if (resHeat.aquecimento) setHeatData(resHeat.aquecimento);
      if (resField.anomalias) setFieldAnomalies(resField.anomalias);
      if (resProt.releunit) setProtectionData(resProt.releunit);
      if (resReg.registro) setRegistries(resReg.registro);

      if (resDga.trafo && resDga.trafo.length > 0) {
        const insights = await getAIInsights(processDGA(resDga.trafo));
        setAiInsights(insights);
      }
    } catch (err) {
      console.error("Erro na sincronização global:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const toggleSelection = (sn: string) => {
    setSelectedSns(prev => 
      prev.includes(sn) ? prev.filter(s => s !== sn) : [...prev, sn]
    );
  };

  const toggleAll = () => {
    if (selectedSns.length === dgaData.length) {
      setSelectedSns([]);
    } else {
      setSelectedSns(dgaData.map(g => g.sn));
    }
  };

  const selectedGroups = dgaData.filter(g => selectedSns.includes(g.sn));

  const getPriorityStyle = (p: string) => {
    if (p?.toLowerCase().includes('alta')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (p?.toLowerCase().includes('média')) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="max-w-[1600px] mx-auto p-4 lg:p-10">
        
        <header className="flex flex-col xl:flex-row items-center justify-between mb-12 gap-8 border-b border-slate-900 pb-12">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-600/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">PowerGrid <span className="text-indigo-500">Master</span></h1>
              <p className="text-slate-500 font-mono text-xs mt-1 uppercase tracking-widest">Controle de Ativos Industriais v2.0</p>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center bg-slate-900/60 p-2 rounded-3xl border border-slate-800 backdrop-blur-xl">
            {[
              { id: 'dga', label: 'Monitor Químico' },
              { id: 'aquecimento', label: 'Aquecimento' },
              { id: 'campo', label: 'Anomalias Campo' },
              { id: 'reles', label: 'Relés/Units' },
              { id: 'registros', label: 'Diário' },
              { id: 'novo-registro', label: '+ Registro' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'dga' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <DashboardStats trafos={dgaData} />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3">
                <TransformerList 
                  groups={dgaData} 
                  onSelect={setSelectedGroup} 
                  selectedSns={selectedSns} 
                  onToggleSelection={toggleSelection} 
                  onToggleAll={toggleAll}
                />
              </div>
              <AIAnalysisPanel insights={aiInsights} loading={loading} />
            </div>
          </div>
        )}

        {/* Floating Batch Actions Bar */}
        {selectedSns.length > 0 && activeTab === 'dga' && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-[#0f172a] border border-indigo-500/30 px-8 py-4 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex items-center gap-8">
              <div className="flex items-center gap-3 pr-8 border-r border-slate-800">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                  {selectedSns.length}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos Selecionados</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowComparison(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                >
                  Comparar Históricos
                </button>
                <button 
                  onClick={() => setSelectedSns([])}
                  className="bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Limpar Seleção
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aquecimento' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {heatData.map((item, i) => (
              <div 
                key={i} 
                className="bg-slate-900/60 border border-slate-800 p-8 rounded-[2rem] hover:border-orange-500/30 cursor-pointer transition-all group"
                onClick={() => setSelectedHeatData(item)}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.se}</span>
                  <div className={`w-3 h-3 rounded-full ${item.temperatura > 70 ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-orange-400 transition-colors">{item.equipamento}</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black ${item.temperatura > 70 ? 'text-orange-500' : 'text-white'}`}>{item.temperatura}°C</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">Termografia</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'campo' && (
          <div className="animate-in fade-in duration-500 bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/50">
                   <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">OS / Data</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipamento</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Anomalia</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dias</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                   {fieldAnomalies.map((ano, i) => (
                     <tr 
                        key={i} 
                        className="hover:bg-indigo-500/10 cursor-pointer transition-all group"
                        onClick={() => setSelectedFieldAnomaly(ano)}
                     >
                        <td className="px-8 py-6">
                           <p className="text-white font-black group-hover:text-indigo-400">OS: {ano.os}</p>
                           <p className="text-[10px] text-slate-600 font-mono">{ano.data}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-white font-bold">{ano.equipamento}</p>
                           <p className="text-[10px] text-slate-600 uppercase font-black">{ano.seArea} • {ano.circuitoParque}</p>
                        </td>
                        <td className="px-8 py-6 max-w-xs">
                           <p className="text-slate-300 text-sm line-clamp-1">{ano.anomalia}</p>
                           <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black ${getPriorityStyle(ano.prioridade)}`}>{ano.prioridade}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-white font-mono font-bold">{ano.diasCorridos}d</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <span className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase">{ano.status}</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'reles' && (
          <div className="animate-in zoom-in-95 duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {protectionData.map((unit, i) => (
              <ProtectionUnit key={i} unit={unit} />
            ))}
            {protectionData.length === 0 && (
              <div className="col-span-full py-24 text-center">
                <p className="text-slate-600 font-black uppercase tracking-widest">Nenhuma unidade de proteção mapeada</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'registros' && (
          <div className="animate-in fade-in duration-500 space-y-8">
             <div className="bg-slate-900/60 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">Histórico de Observações Técnicas</h3>
                <div className="space-y-6">
                   {registries.map((reg, i) => (
                     <div key={i} className="p-8 bg-slate-950/50 border border-slate-800 rounded-3xl group hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-4">
                              <span className="text-white font-black text-xl">{reg.ativoparque}</span>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                reg.gravidade === 'Crítica' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-400'
                              }`}>{reg.gravidade}</span>
                           </div>
                           <span className="text-slate-600 font-mono text-xs font-bold">{reg.data}</span>
                        </div>
                        <p className="text-indigo-400 text-[10px] font-black uppercase mb-2 tracking-widest">{reg.tipo}</p>
                        <p className="text-slate-400 text-sm leading-relaxed italic">"{reg.observacaotecnica}"</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'novo-registro' && (
          <AnomaliesTab assets={dgaData} onSuccess={() => {
            setActiveTab('registros');
            fetchAllData();
          }} />
        )}

        {selectedGroup && <DetailModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
        {selectedFieldAnomaly && (
          <AnomalyDetailModal 
            anomaly={selectedFieldAnomaly} 
            onClose={() => setSelectedFieldAnomaly(null)} 
          />
        )}
        {selectedHeatData && (
          <HeatDetailModal 
            data={selectedHeatData} 
            onClose={() => setSelectedHeatData(null)} 
          />
        )}
        {showComparison && (
          <ComparisonPanel 
            groups={selectedGroups} 
            onClose={() => setShowComparison(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default App;
