
import React from 'react';
import { TransformerStatus } from '../types';

interface StatusBadgeProps {
  status: TransformerStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case TransformerStatus.NORMAL:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case TransformerStatus.ALERTA:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case TransformerStatus.CRITICO:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getColors()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
