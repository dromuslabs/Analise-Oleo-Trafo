
import React from 'react';
import { HeatData } from '../types';

interface HeatDetailModalProps {
  data: HeatData | null;
  onClose: () => void;
}

const HeatDetailModal: React.FC<HeatDetailModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  const getSeverity = (temp: number) => {
    if (temp >= 75) return { label: 'CRÍTICO', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    if (temp >= 55) return { label: 'ALERTA', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { label: 'NORMAL', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  };

  const severity = getSeverity(data.temperatura);
  const progressWidth = Math.min(Math.max((data.temperatura / 100) * 100, 0), 100);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0f172a] border border-slate-800 rounded-[3rem] w-full max-w-2xl shadow-[0_0_80px_rgba(249,115,22,0.15)] overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${data.temperatura > 70 ? 'bg-orange-600 animate-pulse' : 'bg-slate-800'}`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14l-1.121 2.121z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{data.equipamento}</h2>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Subestação: {data.se}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 space-y-10">
          
          {/* Main Temp Display */}
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${severity.color}`}>Status Térmico: {severity.label}</span>
            <div className="relative inline-block">
               <span className={`text-8xl font-black tracking-tighter ${data.temperatura > 70 ? 'text-orange-500' : 'text-white'}`}>
                 {data.temperatura}°C
               </span>
            </div>
          </div>

          {/* Visual Gauge */}
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
              <span>0°C</span>
              <span>Limite Operacional (100°C)</span>
            </div>
            <div className="h-6 bg-slate-950 rounded-full border border-slate-800 p-1 overflow-hidden relative">
               <div 
                 className={`h-full rounded-full transition-all duration-1000 ease-out ${
                   data.temperatura > 75 ? 'bg-gradient-to-r from-orange-500 to-rose-600' : 
                   data.temperatura > 55 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                   'bg-gradient-to-r from-emerald-500 to-teal-500'
                 }`}
                 style={{ width: `${progressWidth}%` }}
               >
                 <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
               </div>
            </div>
          </div>

          {/* Technical Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/50">
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Recomendação Técnica</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.temperatura > 75 
                  ? "Intervenção imediata recomendada. Verificar conexão e reaperto sob desenergização." 
                  : data.temperatura > 55 
                  ? "Acompanhamento preventivo quinzenal. Planejar limpeza e inspeção de contatos." 
                  : "Condição estável. Próxima inspeção conforme cronograma anual."}
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-600 uppercase">Delta T</span>
                <span className="text-white font-mono text-xs">Simulado</span>
              </div>
              <p className="text-lg font-black text-white">+{Math.max(0, data.temperatura - 35).toFixed(1)}°C <span className="text-[10px] text-slate-500">sobre Ambiente</span></p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Fechar Relatório Térmico
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeatDetailModal;
