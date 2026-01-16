
import React from 'react';
import { ProtectionUnit as ProtectionUnitType } from '../types';

interface ProtectionUnitProps {
  unit: ProtectionUnitType;
}

const ProtectionUnit: React.FC<ProtectionUnitProps> = ({ unit }) => {
  const isCommActive = unit.statusComunica === 'Ativo';
  const isProtNormal = unit.statusProtecao === 'Normal';

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
      {/* Barra lateral indicadora de status de comunicação */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isCommActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{unit.parque}</h4>
        {/* Indicador visual de pulso */}
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2 w-2`}>
            {isCommActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isCommActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
        </div>
      </div>

      <p className="text-lg font-black text-white mb-1 uppercase tracking-tight">{unit.unit}</p>
      <p className="text-[9px] text-slate-600 font-mono mb-6">{unit.painel}</p>
      
      <div className="space-y-4">
        {/* Campo solicitado: Status de Comunicação */}
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Comunicação</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isCommActive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {unit.statusComunica}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Proteção</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isProtNormal ? 'text-emerald-500' : 'text-rose-500'}`}>
              {unit.statusProtecao}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/50 grid grid-cols-1 gap-1">
        <p className="text-[8px] text-slate-700 font-mono uppercase">SN Rele: {unit.snRele}</p>
        <p className="text-[8px] text-slate-700 font-mono uppercase">SN Painel: {unit.snPainel}</p>
      </div>
    </div>
  );
};

export default ProtectionUnit;
