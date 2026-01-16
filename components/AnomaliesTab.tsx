
import React, { useState } from 'react';
import { TransformerGroup } from '../types';

interface AnomaliesTabProps {
  assets: TransformerGroup[];
  onSuccess?: () => void;
}

const AnomaliesTab: React.FC<AnomaliesTabProps> = ({ assets, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ativoparque: '',
    data: new Date().toISOString().split('T')[0],
    gravidade: 'Média',
    tipo: 'Inspeção Visual',
    observacaotecnica: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ativoparque || !formData.observacaotecnica) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    const BASE_API = 'https://api.sheety.co/08e6cbbffee520029dcb64480d35d1a8/controleasi';

    try {
      const response = await fetch(`${BASE_API}/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registro: {
            ativoparque: formData.ativoparque,
            data: formData.data,
            gravidade: formData.gravidade,
            tipo: formData.tipo,
            observacaotecnica: formData.observacaotecnica
          }
        })
      });

      if (!response.ok) throw new Error('Falha ao salvar registro.');

      alert("Registro sincronizado!");
      setFormData({
        ativoparque: '',
        data: new Date().toISOString().split('T')[0],
        gravidade: 'Média',
        tipo: 'Inspeção Visual',
        observacaotecnica: ''
      });

      if (onSuccess) onSuccess();

    } catch (err: any) {
      setError(err.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 p-6 lg:p-12 rounded-2xl lg:rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3 lg:gap-4 mb-8 lg:mb-10">
        <div className="bg-indigo-600 p-2 lg:p-3 rounded-xl lg:rounded-2xl">
          <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </div>
        <h2 className="text-xl lg:text-3xl font-black text-white tracking-tighter uppercase">Novo Registro</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
          <div className="space-y-1.5 lg:space-y-3">
            <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Equipamento</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-white text-sm outline-none focus:border-indigo-500 transition-all"
              value={formData.ativoparque}
              onChange={e => setFormData({...formData, ativoparque: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              {assets.map(a => <option key={a.sn} value={a.tag}>{a.tag} ({a.sn})</option>)}
            </select>
          </div>
          <div className="space-y-1.5 lg:space-y-3">
            <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Data</label>
            <input 
              type="date"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-white text-sm outline-none focus:border-indigo-500 transition-all"
              value={formData.data}
              onChange={e => setFormData({...formData, data: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
          <div className="space-y-1.5 lg:space-y-3">
            <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Gravidade</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-white text-sm outline-none focus:border-indigo-500 transition-all"
              value={formData.gravidade}
              onChange={e => setFormData({...formData, gravidade: e.target.value})}
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          <div className="space-y-1.5 lg:space-y-3">
            <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Tipo</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-white text-sm outline-none focus:border-indigo-500 transition-all"
              value={formData.tipo}
              onChange={e => setFormData({...formData, tipo: e.target.value})}
            >
              <option value="Inspeção Visual">Inspeção Visual</option>
              <option value="Ruído Anormal">Ruído Anormal</option>
              <option value="Vazamento">Vazamento</option>
              <option value="Termografia">Termografia</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-1.5 lg:space-y-3">
          <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Observação Técnica</label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl lg:rounded-3xl px-4 lg:px-6 py-3 lg:py-4 text-white text-sm h-32 lg:h-40 outline-none focus:border-indigo-500 resize-none transition-all placeholder:text-slate-700"
            placeholder="Relate as condições técnicas..."
            value={formData.observacaotecnica}
            onChange={e => setFormData({...formData, observacaotecnica: e.target.value})}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-4 lg:py-6 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest text-white shadow-xl transition-all flex items-center justify-center gap-3 ${
            loading ? 'bg-slate-800 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
          }`}
        >
          {loading ? 'Salvando...' : 'Sincronizar Planilha'}
        </button>
      </form>
    </div>
  );
};

export default AnomaliesTab;
