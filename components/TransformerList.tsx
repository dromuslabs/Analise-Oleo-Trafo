
import React from 'react';
import { TransformerGroup } from '../types';
import StatusBadge from './StatusBadge';

interface TransformerListProps {
  groups: TransformerGroup[];
  selectedSns: string[];
  onSelect: (group: TransformerGroup) => void;
  onToggleSelection: (sn: string) => void;
}

const TransformerList: React.FC<TransformerListProps> = ({ groups, selectedSns, onSelect, onToggleSelection }) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/30 border-b border-slate-800">
              <th className="px-6 py-5 w-12 text-center">Sel.</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Ativo / Identificação</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Última Coleta</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">C2H2 (ppm)</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status DGA</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">
                  Nenhum transformador encontrado na planilha.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr 
                  key={group.sn} 
                  className={`hover:bg-indigo-500/5 transition-all group cursor-pointer ${selectedSns.includes(group.sn) ? 'bg-indigo-500/10' : ''}`}
                  onClick={() => onSelect(group)}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <input 
                        type="checkbox"
                        checked={selectedSns.includes(group.sn)}
                        onChange={() => onToggleSelection(group.sn)}
                        className="w-5 h-5 rounded-lg border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-base group-hover:text-indigo-300 transition-colors">{group.tag}</span>
                      <span className="text-slate-500 font-mono text-[10px] mt-0.5">SN: {group.sn} • {group.local}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-slate-300 font-medium text-sm">
                        {new Date(group.lastReading.data).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">
                        {group.history.length} leituras no total
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-mono font-black text-lg ${group.lastReading.c2h2 > 0.5 ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {group.lastReading.c2h2.toFixed(2)}
                      </span>
                      <div className="h-1 w-12 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${group.lastReading.c2h2 > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(group.lastReading.c2h2 * 50, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={group.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 group-hover:border-indigo-500">
                      Ver Análise
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransformerList;
