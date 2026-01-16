
import React from 'react';
import { FieldAnomaly } from '../types';

interface AnomalyDetailModalProps {
  anomaly: FieldAnomaly | null;
  onClose: () => void;
}

const AnomalyDetailModal: React.FC<AnomalyDetailModalProps> = ({ anomaly, onClose }) => {
  if (!anomaly) return null;

  const getPriorityStyle = (p: string) => {
    if (p?.toLowerCase().includes('alta')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (p?.toLowerCase().includes('média')) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  const dayColor = anomaly.diasCorridos > 30 ? 'text-rose-500' : anomaly.diasCorridos > 15 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl lg:rounded-[3rem] w-full max-w-3xl max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-indigo-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-black text-white tracking-tighter uppercase leading-tight">OS: {anomaly.os}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className={`text-[7px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${getPriorityStyle(anomaly.prioridade)}`}>
                  {anomaly.prioridade}
                </span>
                <span className="text-slate-600 font-mono text-[8px] sm:text-[10px] uppercase">{anomaly.data}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 sm:p-10 space-y-6 sm:space-y-10 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-slate-900/80 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800">
              <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Equipamento</p>
              <p className="text-white font-bold text-xs sm:text-base truncate">{anomaly.equipamento}</p>
            </div>
            <div className="bg-slate-900/80 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800">
              <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Local</p>
              <p className="text-white font-bold text-xs sm:text-base truncate">{anomaly.seArea}</p>
            </div>
            <div className="bg-slate-900/80 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800">
              <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
              <p className="text-indigo-400 font-bold text-xs sm:text-base">{anomaly.status}</p>
            </div>
            <div className="bg-slate-900/80 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800">
              <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Atraso</p>
              <p className={`text-sm sm:text-xl font-black ${dayColor}`}>{anomaly.diasCorridos} Dias</p>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="space-y-6 sm:space-y-8">
            <section>
              <h4 className="text-indigo-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">Descrição</h4>
              <div className="bg-slate-950 p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                {anomaly.anomalia}
              </div>
            </section>

            <section>
              <h4 className="text-emerald-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">Nota Técnica</h4>
              <div className="bg-slate-950 p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-800 text-slate-400 text-xs sm:text-sm leading-relaxed italic border-l-2 sm:border-l-4 border-l-emerald-500/50">
                {anomaly.nota || "Nenhuma nota técnica registrada."}
              </div>
            </section>
          </div>

          <div className="pt-4 sm:pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[8px] sm:text-[10px] text-slate-600 font-mono tracking-tighter uppercase">{anomaly.circuitoParque}</p>
            <button 
              onClick={onClose}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl transition-all"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetailModal;
