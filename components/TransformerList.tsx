
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="px-6 py-4 w-12"></th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Equipamento / SN</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Histórico</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">C2H2 (Atual)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Status DGA</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {groups.map((group) => (
              <tr 
                key={group.sn} 
                className={`hover:bg-slate-800/30 transition-colors group cursor-pointer ${selectedSns.includes(group.sn) ? 'bg-indigo-500/5' : ''}`}
                onClick={() => onSelect(group)}
              >
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox"
                    checked={selectedSns.includes(group.sn)}
                    onChange={() => onToggleSelection(group.sn)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{group.tag}</span>
                    <span className="text-blue-500 font-mono text-xs">SN: {group.sn}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-bold">
                    {group.history.length} coletas
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`font-mono font-bold ${group.lastReading.c2h2 > 0.5 ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {group.lastReading.c2h2.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={group.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-indigo-400 hover:text-white font-bold text-sm">Analise Individual</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransformerList;
