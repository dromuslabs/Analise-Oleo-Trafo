
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
import ProtectionDetailModal from './components/ProtectionDetailModal';
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
  const [selectedProtectionUnit, setSelectedProtectionUnit] = useState<ProtectionUnitType | null>(null);
  const [selectedSns, setSelectedSns] = useState<string[]>([]);
  const [protectionSearch, setProtectionSearch] = useState('');
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

  const filteredProtectionData = protectionData.filter(unit => 
    unit.unit.toLowerCase().includes(protectionSearch.toLowerCase()) ||
    unit.painel.toLowerCase().includes(protectionSearch.toLowerCase()) ||
    unit.parque.toLowerCase().includes(protectionSearch.toLowerCase())
  );

  const getPriorityStyle = (p: string) => {
    if (p?.toLowerCase().includes('alta')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (p?.toLowerCase().includes('média')) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="max-w-[1600px] mx-auto p-2 sm:p-6 lg:p-10">
        
        <header className="flex flex-col xl:flex-row items-center justify-between mb-8 lg:mb-12 gap-6 lg:gap-8 border-b border-slate-900 pb-8 lg:pb-12">
          <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
            <div className="bg-indigo-600 p-3 lg:p-4 rounded-2xl lg:rounded-3xl shadow-2xl shadow-indigo-600/30">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none">PowerGrid <span className="text-indigo-500">Master</span></h1>
              <p className="text-slate-500 font-mono text-[9px] lg:text-xs mt-1 uppercase tracking-widest">Monitoramento Industrial</p>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center bg-slate-900/60 p-1 lg:p-2 rounded-2xl lg:rounded-3xl border border-slate-800 backdrop-blur-xl w-full lg:w-auto gap-1 shadow-inner">
            {[
              { id: 'dga', label: 'Químico' },
              { id: 'aquecimento', label: 'Calor' },
              { id: 'campo', label: 'Campo' },
              { id: 'reles', label: 'Relés' },
              { id: 'registros', label: 'Diário' },
              { id: 'novo-registro', label: '+ Registro' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 min-w-[80px] lg:min-w-0 px-2 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'dga' && (
          <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-700">
            <DashboardStats trafos={dgaData} />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-12">
              <div className="lg:col-span-3 order-2 lg:order-1 overflow-x-auto pb-4">
                <TransformerList 
                  groups={dgaData} 
                  onSelect={setSelectedGroup} 
                  selectedSns={selectedSns} 
                  onToggleSelection={toggleSelection} 
                  onToggleAll={toggleAll}
                />
              </div>
              <div className="order-1 lg:order-2">
                <AIAnalysisPanel insights={aiInsights} loading={loading} />
              </div>
            </div>
          </div>
        )}

        {/* Floating Batch Actions Bar - Mobile Optimized */}
        {selectedSns.length > 0 && activeTab === 'dga' && (
          <div className="fixed bottom-4 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto lg:w-max z-[100] animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-[#0f172a]/95 border border-indigo-500/30 px-4 lg:px-8 py-3 lg:py-4 rounded-2xl lg:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-row items-center justify-between gap-4 lg:gap-8">
              <div className="flex items-center gap-2 lg:gap-3 pr-4 lg:pr-8 border-r border-slate-800">
                <span className="bg-indigo-600 text-white w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center font-black text-xs lg:text-sm">
                  {selectedSns.length}
                </span>
                <span className="hidden sm:inline text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionados</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-4 flex-1 lg:flex-none">
                <button 
                  onClick={() => setShowComparison(true)}
                  className="flex-1 lg:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-3 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  Comparar
                </button>
                <button 
                  onClick={() => setSelectedSns([])}
                  className="flex-1 lg:flex-none bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 px-3 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aquecimento' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {heatData.map((item, i) => (
              <div 
                key={i} 
                className="bg-slate-900/60 border border-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[2rem] hover:border-orange-500/30 cursor-pointer transition-all group"
                onClick={() => setSelectedHeatData(item)}
              >
                <div className="flex justify-between items-start mb-4 lg:mb-6">
                  <span className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.se}</span>
                  <div className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full ${item.temperatura > 70 ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                </div>
                <h3 className="text-xl lg:text-2xl font-black text-white mb-2 tracking-tight group-hover:text-orange-400 transition-colors line-clamp-1">{item.equipamento}</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl lg:text-4xl font-black ${item.temperatura > 70 ? 'text-orange-500' : 'text-white'}`}>{item.temperatura}°C</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Termografia</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'campo' && (
          <div className="animate-in fade-in duration-500 bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-[3rem] overflow-x-auto shadow-2xl">
             <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-800/50">
                   <tr>
                      <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">OS / Data</th>
                      <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipamento</th>
                      <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Anomalia</th>
                      <th className="px-6 lg:px-8 py-4 lg:py-6 text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                   {fieldAnomalies.map((ano, i) => (
                     <tr 
                        key={i} 
                        className="hover:bg-indigo-500/10 cursor-pointer transition-all group"
                        onClick={() => setSelectedFieldAnomaly(ano)}
                     >
                        <td className="px-6 lg:px-8 py-4 lg:py-6">
                           <p className="text-white font-black group-hover:text-indigo-400 text-sm">OS: {ano.os}</p>
                           <p className="text-[9px] text-slate-600 font-mono">{ano.data}</p>
                        </td>
                        <td className="px-6 lg:px-8 py-4 lg:py-6">
                           <p className="text-white font-bold text-sm">{ano.equipamento}</p>
                           <p className="text-[9px] text-slate-600 uppercase font-black">{ano.seArea}</p>
                        </td>
                        <td className="px-6 lg:px-8 py-4 lg:py-6 max-w-xs">
                           <p className="text-slate-300 text-xs line-clamp-1">{ano.anomalia}</p>
                           <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black ${getPriorityStyle(ano.prioridade)}`}>{ano.prioridade}</span>
                        </td>
                        <td className="px-6 lg:px-8 py-4 lg:py-6 text-center">
                           <span className="bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase">{ano.status}</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'reles' && (
          <div className="space-y-6 lg:space-y-8 animate-in zoom-in-95 duration-500">
            <div className="max-w-xl mx-auto px-4 lg:px-0">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 lg:pl-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Pesquisar Unidade..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl lg:rounded-3xl py-3 lg:py-4 pl-12 lg:pl-14 pr-4 text-white text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                  value={protectionSearch}
                  onChange={(e) => setProtectionSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
              {filteredProtectionData.map((unit, i) => (
                <ProtectionUnit 
                  key={i} 
                  unit={unit} 
                  onClick={() => setSelectedProtectionUnit(unit)}
                />
              ))}
              {filteredProtectionData.length === 0 && (
                <div className="col-span-full py-12 lg:py-24 text-center">
                  <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'registros' && (
          <div className="animate-in fade-in duration-500 space-y-6 lg:space-y-8">
             <div className="bg-slate-900/60 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] border border-slate-800 shadow-2xl">
                <h3 className="text-xl lg:text-2xl font-black text-white mb-6 lg:mb-8 tracking-tighter uppercase">Histórico Diário</h3>
                <div className="space-y-4 lg:space-y-6">
                   {registries.map((reg, i) => (
                     <div key={i} className="p-4 lg:p-8 bg-slate-950/50 border border-slate-800 rounded-xl lg:rounded-3xl group hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start mb-2 lg:mb-4">
                           <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-4">
                              <span className="text-white font-black text-lg lg:text-xl leading-none">{reg.ativoparque}</span>
                              <span className={`w-max px-2 py-0.5 rounded-full text-[8px] lg:text-[9px] font-black uppercase ${
                                reg.gravidade === 'Crítica' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-400'
                              }`}>{reg.gravidade}</span>
                           </div>
                           <span className="text-slate-600 font-mono text-[10px] font-bold">{reg.data}</span>
                        </div>
                        <p className="text-indigo-400 text-[9px] font-black uppercase mb-2 tracking-widest">{reg.tipo}</p>
                        <p className="text-slate-400 text-xs lg:text-sm leading-relaxed italic">"{reg.observacaotecnica}"</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'novo-registro' && (
          <div className="px-2">
            <AnomaliesTab assets={dgaData} onSuccess={() => {
              setActiveTab('registros');
              fetchAllData();
            }} />
          </div>
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
        {selectedProtectionUnit && (
          <ProtectionDetailModal 
            unit={selectedProtectionUnit} 
            onClose={() => setSelectedProtectionUnit(null)} 
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
