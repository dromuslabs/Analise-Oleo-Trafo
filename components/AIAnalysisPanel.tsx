
import React from 'react';
import { InsightReport } from '../types';

interface AIAnalysisPanelProps {
  insights: InsightReport | null;
  loading: boolean;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-indigo-500/10 w-1/3 mb-4 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-800 w-full rounded"></div>
          <div className="h-4 bg-slate-800 w-5/6 rounded"></div>
          <div className="h-4 bg-slate-800 w-4/6 rounded"></div>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-2xl shadow-indigo-500/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-500 p-1.5 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-indigo-100">Insight de IA PowerGrid</h3>
      </div>
      
      <div className="space-y-6">
        <section>
          <h4 className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-2">Resumo de Saúde</h4>
          <p className="text-slate-300 text-lg leading-relaxed">{insights.overallHealth}</p>
        </section>

        {insights.criticalIssues.length > 0 && (
          <section>
            <h4 className="text-rose-400 text-sm font-semibold uppercase tracking-wider mb-2">Problemas Críticos</h4>
            <ul className="space-y-2">
              {insights.criticalIssues.map((issue, idx) => (
                <li key={idx} className="flex gap-2 text-rose-200">
                  <span className="text-rose-500">•</span> {issue}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h4 className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Plano de Ação Sugerido</h4>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-2 text-slate-300">
                <span className="text-emerald-500">✓</span> {rec}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
