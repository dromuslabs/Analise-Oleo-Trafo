
import React from 'react';
import { TransformerGroup } from '../types';
import StatusBadge from './StatusBadge';

interface TransformerListProps {
  groups: TransformerGroup[];
  selectedSns: string[];
  onSelect: (group: TransformerGroup) => void;
  onToggleSelection: (sn: string) => void;
  onToggleAll: () => void;
}

const TransformerList: React.FC<TransformerListProps> = ({ groups, selectedSns, onSelect, onToggleSelection, onToggleAll }) => {
  const allSelected = groups.length > 0 && selectedSns.length === groups.length;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/30 border-b border-slate-800">
              <th className="px-6 py-6 w-12 text-center">
                <div className="flex justify-center">
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={onToggleAll}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer accent-indigo-500"
                  />
                </div>
              </th>
              <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Equipamento</th>
              <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-center">Saúde</th>
              <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-center">Última Coleta</th>
              <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-center">Gás Crítico</th>
              <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-center">Status</th>
              <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-24 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">Aguardando dados da frota...</td>
              </tr>
            ) : (
              groups.sort((a, b) => (a as any).healthScore - (b as any).healthScore).map((group) => {
                const score = (group as any).healthScore || 0;
                const scoreColor = score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-500';
                const isSelected = selectedSns.includes(group.sn);
                
                return (
                  <tr 
                    key={group.sn} 
                    className={`hover:bg-slate-800/40 transition-all group cursor-pointer ${isSelected ? 'bg-indigo-500/5' : ''}`}
                    onClick={() => onSelect(group)}
                  >
                    <td className="px-6 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => onToggleSelection(group.sn)}
                          className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-white font-black text-lg group-hover:text-indigo-400 transition-colors tracking-tight">{group.tag}</span>
                        <span className="text-slate-600 font-mono text-[9px] uppercase tracking-tighter">{group.sn} • {group.local}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-2xl font-black ${scoreColor} tracking-tighter`}>{score}%</span>
                        <div className="w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full ${scoreColor.replace('text-', 'bg-')}`} style={{ width: `${score}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-300 font-bold text-sm">{new Date(group.lastReading.data).toLocaleDateString()}</span>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5">Sincronizado</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                        <span className={`font-mono font-black text-lg ${group.lastReading.c2h2 > 0.3 ? 'text-rose-500' : 'text-emerald-400'}`}>
                          {group.lastReading.c2h2.toFixed(3)}
                        </span>
                        <span className="text-[8px] text-slate-700 font-black uppercase">PPM Acetileno</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <StatusBadge status={group.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        className="bg-slate-800 group-hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black transition-all shadow-xl uppercase tracking-widest"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(group);
                        }}
                      >
                        Detalhar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransformerList;
