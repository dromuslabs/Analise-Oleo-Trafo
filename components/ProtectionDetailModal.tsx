
import React from 'react';
import { ProtectionUnit as ProtectionUnitType } from '../types';

interface ProtectionDetailModalProps {
  unit: ProtectionUnitType | null;
  onClose: () => void;
}

const ProtectionDetailModal: React.FC<ProtectionDetailModalProps> = ({ unit, onClose }) => {
  if (!unit) return null;

  const isCommActive = unit.statusComunica === 'Ativo';
  const isProtNormal = unit.statusProtecao === 'Normal';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl lg:rounded-[3rem] w-full max-w-2xl max-h-[90vh] shadow-[0_0_80px_rgba(79,70,229,0.15)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${isCommActive ? 'bg-indigo-600' : 'bg-slate-800'}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-black text-white tracking-tighter uppercase leading-tight">{unit.unit}</h2>
              <p className="text-slate-500 font-mono text-[8px] sm:text-[10px] uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">{unit.parque}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <span className="text-[7px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 sm:mb-3">Comunicação</span>
              <div className={`text-sm sm:text-xl font-black uppercase tracking-tighter ${isCommActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {unit.statusComunica}
              </div>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-2 sm:mt-3 ${isCommActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            </div>
            <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <span className="text-[7px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 sm:mb-3">Proteção</span>
              <div className={`text-sm sm:text-xl font-black uppercase tracking-tighter ${isProtNormal ? 'text-emerald-500' : 'text-rose-500'}`}>
                {unit.statusProtecao}
              </div>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-2 sm:mt-3 ${isProtNormal ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
            </div>
          </div>

          {/* Technical Hardware Info */}
          <div className="bg-slate-900/50 p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-800/50 space-y-4 sm:space-y-6">
            <h4 className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-slate-800 pb-3 sm:pb-4">Hardware</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase mb-1">SN Relé</p>
                <p className="text-white font-mono font-bold text-xs sm:text-sm tracking-tight bg-slate-950 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-800 truncate">{unit.snRele || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase mb-1">SN Painel</p>
                <p className="text-white font-mono font-bold text-xs sm:text-sm tracking-tight bg-slate-950 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-800 truncate">{unit.snPainel || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase mb-1">Módulo</p>
              <p className="text-indigo-300 font-mono text-[10px] sm:text-sm bg-slate-950 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-800 truncate">{unit.snModulo || 'MÓDULO INTEGRADO'}</p>
            </div>
          </div>

          <div className="bg-indigo-600/5 p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-indigo-500/10">
            <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed text-center italic">
              "Unidade monitorada. Oscilações devem ser reportadas ao centro de operações imediatamente."
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 sm:py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all"
          >
            Fechar Monitoramento
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectionDetailModal;
